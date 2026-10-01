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
  CardContent,
  CardActions,
  Grow,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  RadialBarChart, RadialBar, ResponsiveContainer
} from 'recharts';
import { fetchStatsData, ProductStats } from '@/services/dataService';

export default function StatsChart() {
  const [data, setData] = useState<ProductStats[]>([]);
  const [chartType, setChartType] = useState<'bar'|'pie'|'area'|'line'|'radial'>('bar');
  const [viewType, setViewType] = useState<'most'|'least'>('most');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Carga datos
  useEffect(() => {
    fetchStatsData()
      .then(fetched => setData(fetched))
      .catch(console.error);
  }, []);

  if (data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Cargando estadísticas…</Typography>
      </Box>
    );
  }

  const displayData =
    viewType === 'most'
      ? data.slice(0, 10)
      : data.slice(-10).reverse();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  const title = viewType === 'most'
    ? 'Top 10 Productos Más Vendidos'
    : 'Top 10 Productos Menos Vendidos';

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
        {/* Cabecera con título */}
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: '#f7faf9',
            borderBottom: '1px solid #e0f2f1',
            pb: 0,
          }}
        />

        {/* Filtros */}
        <CardActions
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            px: 2,
            pt: 1,
            pb: 0,
          }}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="view-type-label">Ver</InputLabel>
            <Select
              labelId="view-type-label"
              value={viewType}
              label="Ver"
              onChange={e => setViewType(e.target.value as any)}
            >
              <MenuItem value="most">Más vendidos</MenuItem>
              <MenuItem value="least">Menos vendidos</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="chart-type-label">Tipo de gráfico</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              label="Tipo de gráfico"
              onChange={e => setChartType(e.target.value as any)}
            >
              <MenuItem value="bar">Barras</MenuItem>
              <MenuItem value="pie">Pastel</MenuItem>
              <MenuItem value="area">Área</MenuItem>
              <MenuItem value="line">Línea</MenuItem>
              <MenuItem value="radial">Radial</MenuItem>
            </Select>
          </FormControl>
        </CardActions>

        {/* Contenido: gráfico */}
        <CardContent sx={{ pt: 1, pb: 2 }}>
          <Box sx={{ width: '100%', height: isMobile ? 300 : 400 }}>
            {/* ResponsiveContainer exige un único hijo: el gráfico se resuelve
                en una cadena ternaria y se le pasa como único hijo. */}
            <ResponsiveContainer>
              {/* BARRAS */}
              {chartType === 'bar' ? (
                <BarChart
                  data={displayData}
                  layout={isMobile ? 'vertical' : 'horizontal'}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={!isMobile}
                    horizontal={isMobile}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888"
                    type={isMobile ? 'number' : 'category'}
                  />
                  <YAxis
                    stroke="#888"
                    type={isMobile ? 'category' : 'number'}
                    dataKey={isMobile ? 'name' : undefined}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="sold" fill="#5B8FF9" radius={[8,8,0,0]} />
                </BarChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={displayData}
                    dataKey="sold"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 120}
                  >
                    {displayData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : chartType === 'area' ? (
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sold"
                    stroke={COLORS[0]}
                    fill="url(#colorData)"
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={displayData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sold"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                  />
                </LineChart>
              ) : chartType === 'radial' ? (
                <RadialBarChart
                  data={displayData}
                  innerRadius="10%"
                  outerRadius="80%"
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    dataKey="sold"
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
                <BarChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="sold" fill="#5B8FF9" radius={[8,8,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
}
