import axios from 'axios';

export const API_AUTH = axios.create({
  baseURL: 'http://192.168.0.113:8080/auth', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export const Login = async (loginData: {
  username:string,
  password:string
}) => {
  try {
    const response = await API_AUTH.post('/login', loginData);
    return response.data;
  } catch (error) {
    console.error('Problema al iniciar sesion', error);
    throw error;
  }
};