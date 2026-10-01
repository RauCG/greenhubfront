'use client';

import { useState } from 'react';
import { Box, Typography, Button, Paper, Stack, IconButton } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { HomeIcon } from 'lucide-react';

// Los formularios solo se necesitan cuando el usuario interactúa. Se cargan en
// el cliente bajo demanda para no enviarlos en el bundle inicial de /login.
const LoginForm = dynamic(() => import('@/components/auth/login-form-component'), {
  ssr: false,
});
const RegisterForm = dynamic(() => import('@/components/auth/register-form-component'), {
  ssr: false,
});

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', md: 'row' }}
      minHeight="100vh"
      bgcolor="#f8f8f8"
    >
      {/* Zona bienvenida */}
      <Box
        flex={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          bgcolor: '#A5D6A7',
          p: { xs: 4, md: 0 },
          height: { xs: 'auto', md: '100vh' },
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Image src="/log.webp" alt="Logo" width={120} height={120} />
          <Typography
            variant="h4"
            fontWeight="bold"
            color="#2E7D32"
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            ¡Bienvenido a GreenHub!
          </Typography>
          <Typography
            variant="subtitle1"
            color="#4CAF50"
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            La mejor selección de plantas para tu hogar
          </Typography>
        </Stack>
      </Box>

      {/* Zona formularios */}
      <Box
        flex={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ p: { xs: 2, md: 0 } }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: { xs: '100%', sm: '80%', md: '80%' },
            maxWidth: 500,
          }}
        >
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <IconButton component={Link} href="/home" color="primary">
              <HomeIcon />
            </IconButton>
          </Box>

          {isLogin ? (
            <LoginForm />
          ) : (
            <RegisterForm />
          )}

          <Box textAlign="center" mt={2}>
            {isLogin ? (
              <Typography variant="body2">
                ¿No tienes cuenta?{' '}
                <Button variant="text" onClick={() => setIsLogin(false)}>
                  Regístrate
                </Button>
              </Typography>
            ) : (
              <IconButton color="primary" onClick={() => setIsLogin(true)}>
                <ArrowBackIcon />
                <Typography variant="body2" ml={1}>
                  Volver al inicio de sesión
                </Typography>
              </IconButton>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
