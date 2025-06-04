// src/components/SmartCalculator/SmartCalculator.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Container,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Ícone para conversão
import SavingsIcon from '@mui/icons-material/Savings'; // Ícone para economia
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios'; 

//  const API_BASE_URL = 'http://localhost:5000';

/**
 * Funções de Cálculo Auxiliares (Expandidas para Conversão de Unidades e Economia)
 */

// Função auxiliar para formatar números com vírgula como separador decimal
// e sem casas decimais se for um inteiro, ou 2 se tiver parte fracionária.
const formatNumberForDisplay = (num) => {
  if (num === null || isNaN(num)) {
    return '';
  }
  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2, // 0 casas se inteiro, 2 se decimal
    maximumFractionDigits: 4 // Limite superior para evitar muitas casas
  });
  return formatted;
};


// 1. Cálculo de Porcentagem
const calculatePercentage = (value, percentage) => {
  if (isNaN(value) || isNaN(percentage)) return null;
  return (value * percentage) / 100;
};

// 2. Adicionar Porcentagem
const addPercentage = (value, percentage) => {
  if (isNaN(value) || isNaN(percentage)) return null;
  return value * (1 + percentage / 100);
};

// 3. Descontar Porcentagem
const discountPercentage = (value, percentage) => {
  if (isNaN(value) || isNaN(percentage)) return null;
  return value * (1 - percentage / 100);
};

// 4. Soma de Listas (já corrigido para lidar com números)
const sumList = (listString) => {
  const cleanedString = listString.replace(/,/g, '+').replace(/e /g, '+');
  const numbers = cleanedString.split('+').map(part => {
    const num = parseFloat(part.trim());
    return isNaN(num) ? 0 : num;
  });
  return numbers.reduce((acc, curr) => acc + curr, 0);
};

// 5. Conversão de Unidades (Novo)
const convertUnit = (value, fromUnit, toUnit, type) => {
  if (isNaN(value) || value === null) return null;

  // Mapeamento de unidades com seus respectivos valores base (em metros, segundos, kg, litros, etc.)
  const conversions = {
    time: {
      'segundos': 1,
      'minutos': 60,
      'horas': 3600,
      'dias': 86400,
    },
    length: {
      'milímetros': 0.001,
      'centímetros': 0.01,
      'metros': 1,
      'quilômetros': 1000,
      'polegadas': 0.0254,
      'pés': 0.3048,
      'jardas': 0.9144,
      'milhas': 1609.34,
    },
    weight: {
        'miligramas': 0.000001,
        'gramas': 0.001,
        'quilogramas': 1,
        'libras': 0.453592,
        'onças': 0.0283495,
        'toneladas': 1000,
    },
    volume: {
        'mililitros': 0.001,
        'litros': 1,
        'metros_cúbicos': 1000,
        'galões_us': 3.78541,
        'galões_uk': 4.54609,
    },
  };

  if (!conversions[type] || !conversions[type][fromUnit] || !conversions[type][toUnit]) {
    return null; // Unidades ou tipo de conversão não suportados
  }

  const valueInBase = value * conversions[type][fromUnit];
  return valueInBase / conversions[type][toUnit];
};

// 6. Cálculo de Economia (Novo)
const calculateSavings = (currentCost, newCost) => {
  if (isNaN(currentCost) || isNaN(newCost) || currentCost <= 0) return null;

  const savingsValue = currentCost - newCost;
  const savingsPercentage = (savingsValue / currentCost) * 100;

  return {
    value: savingsValue,
    percentage: savingsPercentage,
  };
};


function SmartCalculator() {
  const navigate = useNavigate();
  const theme = useTheme();

  // Estados para o modo de texto livre (antigo)
  const [textInput, setTextInput] = useState('');

  // Estados para o modo de seleção de botões (novo)
  const [calculationType, setCalculationType] = useState(''); // 'percentage', 'unit_conversion', 'savings', etc.
  const [inputValue, setInputValue] = useState('');
  const [percentageValue, setPercentageValue] = useState(''); // Para cálculos de porcentagem
  const [unitValue, setUnitValue] = useState(''); // Valor para conversão de unidades
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [unitType, setUnitType] = useState(''); // 'time', 'length', 'weight', 'volume'
  const [currentCost, setCurrentCost] = useState(''); // Para cálculo de economia
  const [newCost, setNewCost] = useState('');     // Para cálculo de economia

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const clearInputs = useCallback(() => {
    setTextInput('');
    setInputValue('');
    setPercentageValue('');
    setUnitValue('');
    setFromUnit('');
    setToUnit('');
    setUnitType('');
    setCurrentCost('');
    setNewCost('');
    setResult(null);
    setError('');
  }, []);

  const handleCalculationTypeChange = (event) => {
    setCalculationType(event.target.value);
    clearInputs(); // Limpa inputs ao mudar o tipo de cálculo
  };

  const handleCalculate = async () => {
    setResult(null);
    setError('');

    if (calculationType === 'text_input') {
      if (!textInput.trim()) {
        setError("Por favor, digite uma expressão para calcular.");
        return;
      }

      // Tentar primeiro a interpretação via API (para regras mais complexas como regra de 3)
      try {
        // CORREÇÃO AQUI: Usando a instância 'api' importada
        const response = await api.post('/smart-calculator-interpret', {
          expression: textInput,
        });

        if (response.data.result) {
          setResult(response.data.result);
          return;
        } else if (response.data.error) {
          setError(response.data.error);
          return;
        }
      } catch (apiError) {
        console.error("Erro ao chamar a API da calculadora:", apiError);
        // Fallback: Se a API falhar, tente o cálculo local.
        // Não defina erro aqui para permitir o fallback.
      }

      // --- Lógica de Cálculo Local (Fallback e Cálculos Simples do modo texto) ---
      let calculatedResult = null;
      let calculationError = '';

      // Tentar identificar e calcular operações matemáticas diretas (ex: 10+20-5)
      try {
        const cleanInput = textInput.toLowerCase()
          .replace(/soma\s*/g, '')
          .replace(/total\s*/g, '')
          .replace(/adicionar\s*/g, '+')
          .replace(/mais\s*/g, '+')
          .replace(/menos\s*/g, '-')
          .replace(/vezes\s*/g, '*')
          .replace(/dividido por\s*/g, '/')
          .replace(/,/g, '.'); // Trocar vírgula por ponto para números decimais

        // Regex mais rigorosa para expressões matemáticas básicas
        const mathExpressionMatch = cleanInput.match(/^[\d\s\+\-\*\/\.()]+$/);
        if (mathExpressionMatch) {
          try {
            // CUIDADO: eval() é perigoso para entradas não sanitizadas.
            // Para produção, use uma biblioteca como 'mathjs' para avaliação segura.
            calculatedResult = eval(cleanInput);
            if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
              calculationError = "Expressão matemática inválida.";
            } else {
              setResult(`Resultado: ${formatNumberForDisplay(calculatedResult)}`);
              setError('');
              return;
            }
          } catch (e) {
            calculationError = "Erro na expressão matemática.";
          }
        }
      } catch (e) {
        calculationError = "Erro ao processar expressão matemática.";
      }

      // Cálculo de Porcentagem (modo texto)
      const percentMatch = textInput.toLowerCase().match(/(\d+[,.]?\d*)\s*%\s*(?:de|do|da)\s*(\d+[,.]?\d*)/);
      if (percentMatch) {
        const percentage = parseFloat(percentMatch[1].replace(',', '.'));
        const value = parseFloat(percentMatch[2].replace(',', '.'));
        if (!isNaN(percentage) && !isNaN(value)) {
          calculatedResult = calculatePercentage(value, percentage);
          setResult(`Resultado: ${formatNumberForDisplay(calculatedResult)}`);
          setError('');
          return;
        }
      }

      // Adicionar Porcentagem (modo texto)
      const addPercentMatch = textInput.toLowerCase().match(/(?:adicionar|aumentar)\s*(\d+[,.]?\d*)\s*%\s*(?:a|em)\s*(\d+[,.]?\d*)/);
      if (addPercentMatch) {
        const percentage = parseFloat(addPercentMatch[1].replace(',', '.'));
        const value = parseFloat(addPercentMatch[2].replace(',', '.'));
        if (!isNaN(percentage) && !isNaN(value)) {
          calculatedResult = addPercentage(value, percentage);
          setResult(`Resultado: ${formatNumberForDisplay(calculatedResult)}`);
          setError('');
          return;
        }
      }

      // Descontar Porcentagem (modo texto)
      const discountPercentMatch = textInput.toLowerCase().match(/(?:descontar|tirar|subtrair)\s*(\d+[,.]?\d*)\s*%\s*(?:de|do|da)\s*(\d+[,.]?\d*)/);
      if (discountPercentMatch) {
        const percentage = parseFloat(discountPercentMatch[1].replace(',', '.'));
        const value = parseFloat(discountPercentMatch[2].replace(',', '.'));
        if (!isNaN(percentage) && !isNaN(value)) {
          calculatedResult = discountPercentage(value, percentage);
          setResult(`Resultado: ${formatNumberForDisplay(calculatedResult)}`);
          setError('');
          return;
        }
      }

      // Soma de Listas (modo texto)
      if (textInput.toLowerCase().includes('soma') || textInput.includes('+') || textInput.includes(',')) {
        const sumResult = sumList(textInput);
        if (!isNaN(sumResult)) {
          setResult(`Resultado da soma: ${formatNumberForDisplay(sumResult)}`);
          setError('');
          return;
        }
      }

      // Se nenhuma lógica correspondente for encontrada no modo texto
      if (calculatedResult === null && calculationError === '') {
        setError("Não entendi sua solicitação. Por favor, tente refrasear ou usar um dos exemplos.");
      } else if (calculationError !== '') {
        setError(calculationError);
      }

    } else if (calculationType === 'percentage_calc') {
      // Lógica para cálculo de Porcentagem via inputs
      const val = parseFloat(inputValue);
      const perc = parseFloat(percentageValue);

      if (isNaN(val) || isNaN(perc)) {
        setError("Por favor, insira valores numéricos válidos para o cálculo de porcentagem.");
        return;
      }
      const res = calculatePercentage(val, perc);
      if (res !== null) {
        setResult(`${formatNumberForDisplay(perc)}% de ${formatNumberForDisplay(val)} é: ${formatNumberForDisplay(res)}`);
      } else {
        setError("Erro ao calcular porcentagem.");
      }
    } else if (calculationType === 'add_percentage') {
        const val = parseFloat(inputValue);
        const perc = parseFloat(percentageValue);

        if (isNaN(val) || isNaN(perc)) {
            setError("Por favor, insira valores numéricos válidos para o cálculo de aumento percentual.");
            return;
        }
        const res = addPercentage(val, perc);
        if (res !== null) {
            setResult(`${formatNumberForDisplay(val)} mais ${formatNumberForDisplay(perc)}% é: ${formatNumberForDisplay(res)}`);
        } else {
            setError("Erro ao adicionar porcentagem.");
        }
    } else if (calculationType === 'discount_percentage') {
        const val = parseFloat(inputValue);
        const perc = parseFloat(percentageValue);

        if (isNaN(val) || isNaN(perc)) {
            setError("Por favor, insira valores numéricos válidos para o cálculo de desconto percentual.");
            return;
        }
        const res = discountPercentage(val, perc);
        if (res !== null) {
            setResult(`${formatNumberForDisplay(val)} menos ${formatNumberForDisplay(perc)}% é: ${formatNumberForDisplay(res)}`);
        } else {
            setError("Erro ao descontar porcentagem.");
        }
    } else if (calculationType === 'unit_conversion') {
      // Lógica para conversão de unidades
      const val = parseFloat(unitValue);
      if (isNaN(val) || !fromUnit || !toUnit || !unitType) {
        setError("Por favor, insira um valor numérico e selecione as unidades de origem e destino.");
        return;
      }
      const converted = convertUnit(val, fromUnit, toUnit, unitType);
      if (converted !== null) {
        setResult(`${formatNumberForDisplay(val)} ${fromUnit} é igual a: ${formatNumberForDisplay(converted)} ${toUnit}`);
      } else {
        setError("Erro na conversão de unidades. Verifique as unidades selecionadas ou o tipo de unidade.");
      }
    } else if (calculationType === 'savings_calculation') {
      // Lógica para cálculo de economia
      const current = parseFloat(currentCost);
      const newC = parseFloat(newCost);

      if (isNaN(current) || isNaN(newC) || current <= 0) {
        setError("Por favor, insira custos numéricos válidos (custo atual deve ser maior que zero).");
        return;
      }

      const savings = calculateSavings(current, newC);
      if (savings !== null) {
        // Formatação da porcentagem com 2 casas decimais e vírgula
        const formattedPercentage = savings.percentage.toFixed(2).replace('.', ',');
        setResult(
          `Economia: R$ ${formatNumberForDisplay(savings.value)} (${formattedPercentage}%)`
        );
      } else {
        setError("Erro ao calcular economia.");
      }
    } else {
      setError("Por favor, selecione um tipo de cálculo.");
    }
  };

  const displayResult = useMemo(() => {
    if (error) {
      return <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>;
    }
    if (result !== null) {
      return (
        <Paper elevation={3} sx={{ p: 2, mt: 3, backgroundColor: theme.palette.success.light, color: theme.palette.success.contrastText, borderRadius: '8px' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {result}
          </Typography>
        </Paper>
      );
    }
    return null;
  }, [result, error, theme]);

  // Opções de unidades para conversão - AGORA EM PORTUGUÊS
  const unitOptions = {
    time: [
      { value: 'segundos', label: 'Segundos' },
      { value: 'minutos', label: 'Minutos' },
      { value: 'horas', label: 'Horas' },
      { value: 'dias', label: 'Dias' },
    ],
    length: [
      { value: 'milímetros', label: 'Milímetros' },
      { value: 'centímetros', label: 'Centímetros' },
      { value: 'metros', label: 'Metros' },
      { value: 'quilômetros', label: 'Quilômetros' },
      { value: 'polegadas', label: 'Polegadas' },
      { value: 'pés', label: 'Pés' },
      { value: 'jardas', label: 'Jardas' },
      { value: 'milhas', label: 'Milhas' },
    ],
    weight: [
        { value: 'miligramas', label: 'Miligramas' },
        { value: 'gramas', label: 'Gramas' },
        { value: 'quilogramas', label: 'Quilogramas' },
        { value: 'libras', label: 'Libras' },
        { value: 'onças', label: 'Onças' },
        { value: 'toneladas', label: 'Toneladas' },
    ],
    volume: [
        { value: 'mililitros', label: 'Mililitros' },
        { value: 'litros', label: 'Litros' },
        { value: 'metros_cúbicos', label: 'Metros Cúbicos' },
        { value: 'galões_us', label: 'Galões (US)' },
        { value: 'galões_uk', label: 'Galões (UK)' },
    ],
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="voltar" onClick={handleGoBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold' }}>
            Calculadora Inteligente
          </Typography>
        </Toolbar>
      </AppBar>

      <Paper elevation={6} sx={{ p: 4, borderRadius: '12px', backgroundColor: theme.palette.background.paper }}>
        <Typography variant="h4" gutterBottom align="center" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
          Realize seus Cálculos
        </Typography>

        {/* Seleção do Tipo de Cálculo */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="calculation-type-label">Selecione o Tipo de Cálculo</InputLabel>
          <Select
            labelId="calculation-type-label"
            id="calculation-type-select"
            value={calculationType}
            label="Selecione o Tipo de Cálculo"
            onChange={handleCalculationTypeChange}
          >
            <MenuItem value=""><em>Nenhum</em></MenuItem>
            <MenuItem value="text_input">Modo de Texto Livre (Ex: "20% de 300")</MenuItem>
            <MenuItem value="percentage_calc">Cálculo de Porcentagem (Ex: "X% de Y")</MenuItem>
            <MenuItem value="add_percentage">Adicionar Porcentagem (Ex: "Y + X%")</MenuItem>
            <MenuItem value="discount_percentage">Descontar Porcentagem (Ex: "Y - X%")</MenuItem>
            <MenuItem value="unit_conversion">Conversão de Unidades</MenuItem>
            <MenuItem value="savings_calculation">Cálculo de Economia</MenuItem>
            {/* Adicionar mais tipos conforme necessário */}
          </Select>
        </FormControl>

        {/* Renderização condicional dos inputs com base no tipo de cálculo */}
        {calculationType === 'text_input' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Libere a sua criatividade! Digite sua pergunta ou cálculo de forma natural. Nossa IA tentará entender e resolver para você. O Fyn está aprendendo e pode cometer erros, considere checar os resultados ou usar nossas outras ferramentas de cálculo.
            </Typography>
            <TextField
              fullWidth
              label="Digite sua pergunta ou cálculo (ex: 20% de 300, 10+20+30, se 10 vale 20, quanto vale 30?)"
              variant="outlined"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              multiline
              rows={4}
            />
          </Box>
        )}

        {calculationType === 'percentage_calc' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Descubra a porcentagem de um valor de forma simples. Informe o valor total e a porcentagem que deseja calcular.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Total"
                  type="number"
                  variant="outlined"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Porcentagem (%)"
                  type="number"
                  variant="outlined"
                  value={percentageValue}
                  onChange={(e) => setPercentageValue(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {calculationType === 'add_percentage' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Precisa adicionar uma porcentagem a um valor? Use esta ferramenta para calcular o novo total com o acréscimo percentual.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Original"
                  type="number"
                  variant="outlined"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Porcentagem a Adicionar (%)"
                  type="number"
                  variant="outlined"
                  value={percentageValue}
                  onChange={(e) => setPercentageValue(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {calculationType === 'discount_percentage' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Calcule facilmente o valor final após um desconto. Informe o valor original e a porcentagem de desconto.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Original"
                  type="number"
                  variant="outlined"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Porcentagem de Desconto (%)"
                  type="number"
                  variant="outlined"
                  value={percentageValue}
                  onChange={(e) => setPercentageValue(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {calculationType === 'unit_conversion' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Converta valores entre diferentes unidades de medida (tempo, comprimento, peso, volume). Selecione o tipo de unidade, o valor e as unidades de origem e destino.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="unit-type-label">Tipo de Unidade</InputLabel>
                  <Select
                    labelId="unit-type-label"
                    id="unit-type-select"
                    value={unitType}
                    label="Tipo de Unidade"
                    onChange={(e) => {
                      setUnitType(e.target.value);
                      setFromUnit(''); // Limpa unidades ao mudar o tipo
                      setToUnit('');
                    }}
                  >
                    <MenuItem value=""><em>Selecione o Tipo</em></MenuItem>
                    <MenuItem value="time">Tempo</MenuItem>
                    <MenuItem value="length">Comprimento</MenuItem>
                    <MenuItem value="weight">Peso</MenuItem>
                    <MenuItem value="volume">Volume</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {unitType && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    variant="outlined"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                  />
                </Grid>
              )}
              {unitType && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="from-unit-label">De</InputLabel>
                    <Select
                      labelId="from-unit-label"
                      id="from-unit-select"
                      value={fromUnit}
                      label="De"
                      onChange={(e) => setFromUnit(e.target.value)}
                    >
                      <MenuItem value=""><em>Selecione a Unidade</em></MenuItem>
                      {unitOptions[unitType]?.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>{unit.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {unitType && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="to-unit-label">Para</InputLabel>
                    <Select
                      labelId="to-unit-label"
                      id="to-unit-select"
                      value={toUnit}
                      label="Para"
                      onChange={(e) => setToUnit(e.target.value)}
                    >
                      <MenuItem value=""><em>Selecione a Unidade</em></MenuItem>
                      {unitOptions[unitType]?.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>{unit.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {calculationType === 'savings_calculation' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Saiba quanto você vai **economizar** em uma compra, transação ou qualquer situação! Basta informar o custo original e o novo custo (com desconto, promoção, etc.) para ver a economia em valor e porcentagem!
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custo Atual (Original)"
                  type="number"
                  variant="outlined"
                  value={currentCost}
                  onChange={(e) => setCurrentCost(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Novo Custo (ou Custo Desejado)"
                  type="number"
                  variant="outlined"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}


        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleCalculate}
          startIcon={<CalculateIcon />}
          sx={{ borderRadius: '8px', py: 1.5 }}
        >
          Calcular
        </Button>

        {displayResult}

        <Divider sx={{ my: 3 }} />

        {/* Exemplo de Uso (visível apenas no modo de texto livre para evitar confusão) */}
        {calculationType === 'text_input' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Exemplos para o Modo de Texto Livre:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• `20% de 300`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `adicionar 10% a 200`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `descontar 5% de 150`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `soma 10, 20, 30` ou `10+20+30`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `paguei 3000 em 4 itens`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `qual o melhor: 1kg por 20 ou 2.5kg por 45`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `regra de 3: se 10 vale 20, quanto vale 30?`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `2700 com reajuste de 10%`" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• `quero juntar 5000 em 12 meses`" />
              </ListItem>
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default SmartCalculator;
