/********* imports necessarios ***************************/
import express from 'express';

// 1. Importe o dotenv
import * as dotenv from 'dotenv'; 
// 2. Chame a função config() logo no início
dotenv.config();
// Agora você pode importar e usar o PrismaClient
import { PrismaClient } from '@prisma/client';
/******************************************************/

// agr podemos ter acesso a todas as informações do banco de dados
const prisma = new PrismaClient();

const app = express();

app.use(express.json());

//inserir um novo usuario
app.post('/usuarios', async (req, res) => {    

   try 
   {
        // Tentar criar o usuário no banco de dados
        const novoUsuario = await prisma.user.create({
            data: {
                // Use os dados do corpo da requisição (req.body)
                name: name || 'Rich', // Use 'Rich' como fallback
                email: email || 'hello@prisma.com',
                age: age || "30",
            },
        });

        // Sucesso: Envia a resposta de sucesso (Status 201 Created)
        // O método .status(201).json() é mais limpo que .send() ou .json() separados.
        res.status(201).json({
            mensagem: 'Usuário criado com sucesso',
            usuario: novoUsuario
        });

    } catch (error) {
        //  Erro: Captura qualquer erro (ex: email duplicado, campo ausente)
        console.error('Erro ao criar usuário:', error);

        // Retorna um status de erro adequado (ex: 400 Bad Request ou 500 Internal Server Error)
        // Se o erro for do Prisma (como P2002 - Duplicidade), você pode ser mais específico.
        res.status(500).json({
            mensagem: 'Erro ao criar usuário',
            detalhes: error.message
        });
    }
});

// consultar todos os usuarios
app.get('/usuarios', async (req, res) => {
  try {
        // 1. Consultar todos os usuários no banco de dados
        const allUsers = await prisma.user.findMany();

        // 2. Verificar se a lista está vazia
        if (allUsers.length === 0) {
            // Se não houver usuários, retorna status 200 (OK) com uma mensagem informativa.
            // O status 204 (No Content) também poderia ser usado, mas 200 é comum com mensagem.
            return res.status(200).json({
                message: "Não existem usuários cadastrados."
            });
        }

        // 3. Sucesso: Retorna a lista de usuários com status 200 (OK)
        // O método .json() envia a resposta e finaliza o ciclo de requisição/resposta.
        res.status(200).json(allUsers);

    } catch (error) {
        // 4. Erro: Captura qualquer falha de conexão ou consulta com o Prisma
        console.error('Erro ao buscar usuários:', error);

        // Retorna um status de erro adequado (500 Internal Server Error)
        res.status(500).json({
            message: 'Ocorreu uma falha ao buscar usuários no banco de dados.',
            detalhes: error.message
        });
    }
});

// buscar um usuario pelo id
app.get('/usuarios/:id', async (req, res) => {
  try {
        // Busca o usuário pelo ID
        // Obs: findUnique é geralmente preferido quando se busca por um campo @unique ou @id
        var user = await prisma.user.findUnique({
            where: {
                id: req.params.id,
            },
            // caso seja necessário selecionar apenas alguns campos para otimização
            // select: { id: true, name: true, email: true }, 
        });

        // Verifica se o usuário foi encontrado (lógica corrigida)
        if (!user) {
            // Se o usuário for NULL (não encontrado), retorna 404 Not Found
            return res.status(404).json({ 
                message: `Usuário com ID ${id} não encontrado.`
            });
        }

        // Sucesso: Retorna o usuário encontrado com status 200 OK
        res.status(200).json(user);

    } catch (error) {
        // Erro: Captura falhas (ex: ID inválido, falha na conexão)
        console.error(`Erro ao buscar usuário ${req.params.id}:`, error);

        // O erro P2023 (Invalid ID format) é comum ao usar MongoDB/ObjectId
        if (error.code === 'P2023') {
             return res.status(400).json({ 
                message: `Formato de ID inválido. Certifique-se de que o ID é um ObjectId válido.` 
            });
        }

        // Retorna um erro genérico de servidor
        res.status(500).json({
            message: 'Ocorreu uma falha interna ao buscar o usuário.',
            detalhes: error.message
        });
    }

});

// Editar um usuario
app.put('/usuarios/:id', async (req, res) => {
    // Desestruturar o ID dos parâmetros e os dados do corpo da requisição
    const { id } = req.params;
    const updateData = req.body;

    // Opcional: Se a requisição for PATCH, removemos campos undefined/nulls 
    // para garantir que apenas os campos fornecidos sejam atualizados.
    // (Esta etapa é mais crucial para PATCH, mas útil para PUT também)
    const dataToUpdate = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== null && v !== undefined)
    );

    try {
        // Tenta atualizar o usuário no banco de dados
        const usuarioAtualizado = await prisma.user.update({
            where: {
                id: id,
            },
            data: dataToUpdate,
        });

        // Sucesso: Retorna o objeto do usuário ATUALIZADO com status 200 OK
        res.status(200).json(usuarioAtualizado);

    } catch (error) {
        // Erro: Capturar e tratar diferentes tipos de falhas

        // Tratamento de ID Não Encontrado (Prisma P2025)
        if (error.code === 'P2025') {
            return res.status(404).json({
                message: `Não foi possível encontrar o usuário com ID ${id} para atualização.`,
            });
        }

        // Tratamento de ID Inválido (Prisma P2023 - Formato de ObjectId inválido)
        if (error.code === 'P2023') {
            return res.status(400).json({
                message: `Formato de ID inválido. Certifique-se de que o ID é um ObjectId válido.`,
            });
        }
        
        // Tratamento de Email Duplicado (Prisma P2002 - Unique constraint)
        if (error.code === 'P2002' && error.meta.target.includes('email')) {
             return res.status(409).json({ // 409 Conflict
                message: `O email fornecido já está em uso por outro usuário.`,
            });
        }

        // Erro genérico (500 Internal Server Error)
        console.error('Erro de atualização:', error);
        res.status(500).json({
            message: 'Ocorreu uma falha interna ao atualizar o usuário.',
            detalhes: error.message
        });
    }
});

// deletar um usuario
app.delete('/usuarios/:id', async (req, res) => {
    // Captura o ID dos parâmetros
    const { id } = req.params;

    try {
        // Tenta deletar o usuário
        // O método .delete() no Prisma tenta deletar e lança uma exceção
        // se o registro com o 'where' fornecido não for encontrado.
        await prisma.user.delete({
            where: {
                id: id,
            },
        });

        // Sucesso: Retorna status 204 (No Content) para exclusão bem-sucedida,
        // ou 200 (OK) com uma mensagem (ambos são aceitáveis).
        res.status(200).json({
            message: `Usuário com ID ${id} deletado com sucesso.`
        });
        
    } catch (error) {
        // Erro: Captura e trata os diferentes tipos de falhas

        // Tratamento de ID Não Encontrado (Prisma P2025)
        // O erro P2025 é lançado quando o registro a ser deletado não existe.
        if (error.code === 'P2025') {
            // Retorna 404 Not Found, pois o recurso que se tentou deletar não existe.
            return res.status(404).json({
                message: `Não foi possível encontrar o usuário com ID ${id} para exclusão.`,
            });
        }

        // Tratamento de ID Inválido (Prisma P2023 - Formato de ObjectId inválido)
        if (error.code === 'P2023') {
            // Retorna 400 Bad Request
            return res.status(400).json({
                message: `Formato de ID inválido. Certifique-se de que o ID é um ObjectId válido.`,
            });
        }
        
        // Erro Genérico (500 Internal Server Error)
        console.error(`Erro ao deletar usuário ${id}:`, error);
        res.status(500).json({
            message: 'Ocorreu uma falha interna ao deletar o usuário.',
            detalhes: error.message
        });
    }
});

app.listen(3000);

/*
  usuario: IgorDev
  senha: IgorDev102030
*/