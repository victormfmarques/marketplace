import jwt from 'jsonwebtoken';

export function verificarAuth(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}