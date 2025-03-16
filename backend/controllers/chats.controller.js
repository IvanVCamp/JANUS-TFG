// controllers/chats.controller.js
const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.startChat = async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ msg: 'userId is required' });
  }

  try {
    // Buscar si ya existe un chat entre el usuario actual y el usuario destino
    let chat = await Chat.findOne({ participants: { $all: [currentUserId, userId] } });
    if (!chat) {
      chat = new Chat({ participants: [currentUserId, userId] });
      await chat.save();
    }
    // Poblamos la información de los participantes para enviar datos útiles al frontend
    chat = await Chat.findById(chat._id).populate('participants', 'nombre apellidos email');
    res.status(201).json(chat);
  } catch (err) {
    console.error("Error in startChat:", err);
    res.status(500).json({ msg: 'Error starting chat' });
  }
};

exports.getChats = async (req, res) => {
  const currentUserId = req.user.id;
  try {
    const chats = await Chat.find({ participants: currentUserId }).populate('participants', 'nombre apellidos email');
    res.json(chats);
  } catch (err) {
    console.error("Error in getChats:", err);
    res.status(500).json({ msg: 'Error fetching chats' });
  }
};

exports.getMessages = async (req, res) => {
  const currentUserId = req.user.id;
  const { chatId } = req.params;
  try {
    // Verificar que el usuario esté en el chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some(p => p.toString() === currentUserId)) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).json({ msg: 'Error fetching messages' });
  }
};

exports.sendMessage = async (req, res) => {
  const currentUserId = req.user.id;
  const { chatId } = req.params;
  const { text } = req.body;
  let fileUrl = null;
  let fileName = null;

  // Si se ha subido un archivo, asignar URL y nombre
  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    fileName = req.file.originalname;
  }

  try {
    // Verificar que el usuario actual forma parte del chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some(p => p.toString() === currentUserId)) {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    // Crear y guardar el mensaje
    const message = new Message({
      chat: chatId,
      sender: currentUserId,
      text: text || "",
      fileUrl,
      fileName
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ msg: 'Error sending message', error: err.message });
  }
};
