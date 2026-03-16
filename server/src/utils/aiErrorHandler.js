function getFriendlyAIError(error, fallbackMessage = "AI service is temporarily unavailable.") {
  const rawMessage = error?.message || "";

  if (
    rawMessage.includes("429") ||
    rawMessage.includes("Too Many Requests") ||
    rawMessage.includes("quota") ||
    rawMessage.includes("rate limit")
  ) {
    return {
      statusCode: 429,
      message: "AI service is busy right now. Please try again later.",
    };
  }

  if (
    rawMessage.includes("API_KEY_INVALID") ||
    rawMessage.includes("API key expired") ||
    rawMessage.includes("API key") ||
    rawMessage.includes("Forbidden")
  ) {
    return {
      statusCode: 500,
      message: "AI API key is invalid or expired. Please update the Gemini API key.",
    };
  }

  if (
    rawMessage.includes("404 Not Found") ||
    rawMessage.includes("model") ||
    rawMessage.includes("not supported")
  ) {
    return {
      statusCode: 500,
      message: "AI model is temporarily unavailable. Please try again later.",
    };
  }

  return {
    statusCode: 500,
    message: fallbackMessage,
  };
}

module.exports = {
  getFriendlyAIError,
};
