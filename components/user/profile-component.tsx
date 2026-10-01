'use client';
import { useState, useEffect } from 'react';
import { TextField, Typography, Button, Stack, Avatar, IconButton } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, createOrUpdateUserProfile } from '@/services/authService';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileComponent() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userData = await getUserProfile(user.uid);
       
        if (userData) {
          setName(userData.displayname || '');
          setUsername(userData.username || '');
          setEmail(userData.email || '');
          setPhotoURL(userData.photoURL || '');
          console.log(userData.photoURL)
          console.log(photoURL)
        }
      }
    });
  }, []);


  const handleSave = async () => {
    if (!userId) return;

    let finalPhotoURL = photoURL;

    if (photoFile) {
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${userId}/${photoFile.name}`);

      await uploadBytes(storageRef, photoFile);
      finalPhotoURL = await getDownloadURL(storageRef);
      setPhotoURL(finalPhotoURL);
    }

    await createOrUpdateUserProfile(userId, {
      displayname: name,
      username,
      email,
      photoURL: finalPhotoURL,
      lastUpdated: new Date(),
    });

    alert('Perfil actualizado correctamente.');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="h5" color="#4CAF50">
        Información Personal
      </Typography>

      <Avatar
        src={photoURL || '/default-avatar.webp'} // usa un avatar por defecto si no hay foto
        sx={{ width: 100, height: 100 }}
      />

      <IconButton color="primary" component="label">
        <CameraAltIcon />
        <input type="file" hidden onChange={handlePhotoChange} />
      </IconButton>

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

      <Button
        variant="contained"
        sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#2E7D32' } }}
        onClick={handleSave}
      >
        Guardar cambios
      </Button>
    </Stack>
  );
}
