import express from 'express';

// 1. Importe o dotenv
import * as dotenv from 'dotenv'; 
// 2. Chame a função config() logo no início
dotenv.config();
// Agora você pode importar e usar o PrismaClient
import { PrismaClient } from '@prisma/client';

// agr podemos ter acesso a todas as informações do banco de dados
const prisma = new PrismaClient();

const app = express();

const user = [];

app.use(express.json());

app.post('/usuarios', async (req, res) => {
    
  // indica que o usuario foi criado com sucesso
   if(res.status(201))
    {
      await prisma.user.create({
                                data: {
                                  name: 'Rich',
                                  email: 'hello@prisma.com',
                                  age: "30",
                                  posts: {
                                    create: {
                                      title: 'My first post',
                                    },
                                  },
                                },
                              })

      res.json(req.body);
    }
    else
    {
      res.send('Erro ao criar usuario');
    }
});

app.get('/usuarios', async (req, res) => {
  // consultando usuarios
  if(res.status(200))
    {
      
       var allUsers = await prisma.user.findMany( {
        include: {
          posts: true,
        },
       });

        res.json(allUsers);

    }
    else
    {
      res.send('Ocorreu uma falha ao buscar usuarios');
    }
});



app.put('/usuarios/:id', (req, res) => {
  res.send(`Usuario con ID ${req.params.id} actualizado`);
});

app.delete('/usuarios/:id', (req, res) => {
  res.send(`Usuario con ID ${req.params.id} eliminado`);
}); 

app.listen(3000);

/*
  usuario: IgorDev
  senha: IgorDev102030
*/