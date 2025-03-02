import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your Edinburgh Course Explorer assistant. How can I help you find the right courses?' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputValue.trim() === '') return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: inputValue };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Call API endpoint to get response from OpenAI
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: data.message }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again later.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      <button
        onClick={toggleChatbot}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg focus:outline-none"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col border border-gray-200">
          {/* Chat header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium">Course Explorer Assistant</h3>
            <button 
              onClick={toggleChatbot}
              className="focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div 
                  className={`inline-block p-2 rounded-lg max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-200 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block p-2 rounded-lg max-w-[80%] bg-gray-200 text-gray-800 rounded-tl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2 flex">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-lg disabled:bg-blue-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 