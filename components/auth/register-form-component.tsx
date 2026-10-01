'use client';
import { useState } from 'react';
import { Button, TextField, Typography, Divider, Stack } from '@mui/material';
import { registerUser } from '@/services/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      await registerUser(email, password, name, username);
      alert('Registro completado correctamente. Inicia sesión ahora.');
      router.push('/login');
    } catch (error: any) {
      alert('Error en el registro: ' + error.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" color="#4CAF50" align="center" fontWeight="bold">
        Únete a nosotros
      </Typography>

      <TextField
        fullWidth
        label="Nombre completo"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        fullWidth
        label="Nombre de usuario"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <TextField
        fullWidth
        label="Correo electrónico"
        type="email"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        fullWidth
        label="Contraseña"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <TextField
        fullWidth
        label="Confirmar contraseña"
        type="password"
        variant="outlined"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button
        variant="contained"
        sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#2E7D32' } }}
        onClick={handleRegister}
      >
        Regístrate
      </Button>

      <Divider>O continúa con</Divider>

      <Button
        variant="outlined"
        sx={{
          bgcolor: '#fff',
          color: '#757575',
          textTransform: 'none',
          borderColor: '#ddd',
          boxShadow: 'none',
          '&:hover': {
            bgcolor: '#f7f7f7',
            borderColor: '#ccc',
          },
        }}
        startIcon={
          <Image
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google Logo"
            width={20}
            height={20}
          />
        }
      >
        Iniciar sesión con Google
      </Button>
    </Stack>
  );
}
