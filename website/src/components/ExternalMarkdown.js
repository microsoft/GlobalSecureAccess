import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ExternalMarkdown({ url, title }) {
  const [content, setContent] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(`Failed to load content: ${err.message}`);
        setContent('');
      }
    };

    fetchContent();
  }, [url]);

  // Custom components for ReactMarkdown
  const components = {
    img: ({node, ...props}) => {
      // Handle relative image paths by converting them to absolute GitHub URLs
      let src = props.src;
      
      // If it's a relative path, convert to GitHub raw URL
      if (src && !src.startsWith('http')) {
        // Get the base path from the markdown file URL (which should be raw.githubusercontent.com)
        const basePath = url.substring(0, url.lastIndexOf('/'));
        
        // Construct the full raw URL
        src = src.startsWith('./') ? 
          `${basePath}/${src.slice(2)}` : 
          `${basePath}/${src}`;
        
        // If somehow we got a github.com URL instead of raw.githubusercontent.com, convert it
        if (src.includes('github.com') && !src.includes('raw.githubusercontent.com')) {
          src = src.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
      }
      
      // For any GitHub URLs that aren't raw, add the raw=true parameter
      if (src && src.includes('github.com/') && !src.includes('raw.githubusercontent.com')) {
        src += '?raw=true';
      }
      
      return (
        <img 
          {...props} 
          src={src} 
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
    }
  };

  if (error) {
    return (
      <div>
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          {error}
          <br />
          <a href={url.replace('/raw.githubusercontent.com/', '/github.com/').replace('/main/', '/blob/main/')} 
             target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}