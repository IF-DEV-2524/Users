import express from 'express';

const app = express();

app.get('/usuarios', (req, res) => {
    console.log('Requisição GET recebida em /usuarios');
  res.send('Hello, World!');
});

app.post('/usuarios', (req, res) => {
  res.send('Usuario creado');
});

app.put('/usuarios/:id', (req, res) => {
  res.send(`Usuario con ID ${req.params.id} actualizado`);
});

app.delete('/usuarios/:id', (req, res) => {
  res.send(`Usuario con ID ${req.params.id} eliminado`);
}); 

app.listen(3000);