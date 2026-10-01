'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  Typography,
  Card,
  CardHeader,
  CardActions,
  CardContent,
  Grow
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area, LineChart, Line,
  RadialBarChart, RadialBar, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchOrdersData, OrderStatusCount } from '@/services/dataService';

export default function OrdersChart() {
  const [data, setData] = useState<OrderStatusCount[]>([]);
  const [chartType, setChartType] = useState<'pie'|'radar'|'area'|'line'|'radial'>('pie');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Carga datos
  useEffect(() => {
    fetchOrdersData()
      .then(result => setData(result))
      .catch(err => {
        console.error('Error al cargar datos de pedidos:', err);
      });
  }, []);

  if (data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Cargando estadísticas…</Typography>
      </Box>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  const title = 'Distribución de Pedidos por Estado';

  return (
    <Grow in timeout={500}>
      <Card
        sx={{
          border: '1px solid #e0f2f1',
          boxShadow: 3,
          borderRadius: 2,
          mx: 'auto',
          maxWidth: 960,
        }}
      >
        {/* Título de la tarjeta */}
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: '#f7faf9',
            borderBottom: '1px solid #e0f2f1',
            pb: 0,
          }}
        />

        {/* Filtro de tipo de gráfico */}
        <CardActions
          sx={{
            px: 2,
            pt: 1,
            pb: 0
          }}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="orders-chart-type-label">Tipo de gráfico</InputLabel>
            <Select
              labelId="orders-chart-type-label"
              value={chartType}
              label="Tipo de gráfico"
              onChange={e => setChartType(e.target.value as any)}
            >
              <MenuItem value="pie">Pastel</MenuItem>
              <MenuItem value="radar">Radar</MenuItem>
              <MenuItem value="area">Área</MenuItem>
              <MenuItem value="line">Línea</MenuItem>
              <MenuItem value="radial">Radial</MenuItem>
            </Select>
          </FormControl>
        </CardActions>

        {/* Contenido del gráfico */}
        <CardContent sx={{ pt: 1, pb: 2 }}>
          <Box sx={{ width: '100%', height: isMobile ? 300 : 400 }}>
            {/* ResponsiveContainer exige exactamente un hijo: el gráfico se
                resuelve en una variable y se le pasa como único hijo. */}
            <ResponsiveContainer>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="quantity"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 120}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : chartType === 'radar' ? (
                <RadarChart data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="status" />
                  <Radar
                    name="Pedidos"
                    dataKey="quantity"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              ) : chartType === 'area' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="ordersColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke={COLORS[1]}
                    fill="url(#ordersColor)"
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={data}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke={COLORS[2]}
                    strokeWidth={2}
                  />
                </LineChart>
              ) : chartType === 'radial' ? (
                <RadialBarChart
                  data={data}
                  innerRadius="10%"
                  outerRadius="80%"
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    dataKey="quantity"
                  />
                  <Tooltip />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </RadialBarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="quantity"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 120}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
}
