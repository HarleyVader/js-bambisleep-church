class ChatController {
    constructor(messageModel) {
        this.messageModel = messageModel;
    }

    async sendMessage(req, res) {
        try {
            const { sender, content } = req.body;
            const message = new this.messageModel({
                sender,
                content,
                timestamp: new Date()
            });
            await message.save();
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    }

    async getMessages(req, res) {
        try {
            const messages = await this.messageModel.find().sort({ timestamp: 1 });
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve messages' });
        }
    }
}

module.exports = ChatController;