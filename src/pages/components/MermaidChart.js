import { useEffect } from 'react';
import mermaid from 'mermaid';

const MermaidChart = ({ chart }) => {
  useEffect(() => {
    if (chart) {
      console.log('render chart');
      console.log(chart);
      // Initialize mermaid and render the chart
      mermaid.initialize({
        startOnLoad: true,
      });

      try {
        // Ensure the chart is rendered after the component mounts
        mermaid.contentLoaded(); // Process the chart
      } catch (error) {
        console.error('Error rendering Mermaid chart:', error);
      }
    }
  }, [chart]); // Re-run when chart changes

  // Ensure the chart is rendered correctly
  useEffect(() => {
    if (chart) {
      // Use a timeout to ensure the DOM is fully updated before rendering
      const timeoutId = setTimeout(() => {
        mermaid.contentLoaded(); // Re-process the chart when it changes
      }, 0); // Delay to allow DOM updates

      return () => clearTimeout(timeoutId); // Cleanup timeout on unmount
    }
  }, [chart]); // Re-run when chart changes

  return <div className="mermaid">{chart}</div>;
};

export default MermaidChart;
