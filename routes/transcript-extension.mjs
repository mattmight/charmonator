// extend-transcript.mjs
import express from 'express';
import { fetchChatModel } from '../lib/core.mjs';
import { TranscriptFragment } from '../lib/transcript.mjs';
import { FunctionTool } from '../lib/function.mjs';

const router = express.Router();

router.post('/extension', async (req, res) => {
  let transcriptCopy = null;
  try {
    const {
      model: modelId,
      system,
      temperature,
      transcript: transcriptJson,
      tools,
      // New: Accept an "options" object that can contain response_format, stream, etc.
      options
    } = req.body;

    transcriptCopy = transcriptJson;

    // Basic validation
    if (!modelId || !transcriptJson?.messages) {
      return res.status(400).json({
        error: 'Missing required fields: model and transcript.messages'
      });
    }

    // Create chat model
    const chatModel = fetchChatModel(modelId);

    // Set configuration
    if (system) chatModel.system = system;
    if (temperature != null) chatModel.temperature = temperature;

    // In case you need to register ephemeral tools:
    // (Example placeholder; adjust or remove as needed.)
    if (tools) {
      tools.forEach(toolConfig => {
        const tool = new FunctionTool(async (args) => {
          // In real implementation, do the actual tool work here.
          return { result: 'Tool execution placeholder' };
        });
        tool.name = toolConfig.name;
        tool.description = toolConfig.description;
        tool.input_schema = toolConfig.input_schema;
        chatModel.addTool(tool);
      });
    }

    // Convert incoming transcript to internal format
    const incomingTranscript = TranscriptFragment.fromJSON(transcriptJson);

    // If no options object was provided, default to empty
    const invocationOptions = options || {};

    // Generate response
    const suffix = await chatModel.extendTranscript(
      incomingTranscript,
      null,
      null,
      invocationOptions
    );

    // Return the suffix as JSON
    res.json(suffix.toJSON());

  } catch (error) {
    console.error('Error extending transcript:', error);
    // Expand all inner objects to a depth of 10 for debugging:
    console.error('Transcript', JSON.stringify(transcriptCopy, null, 10));
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
