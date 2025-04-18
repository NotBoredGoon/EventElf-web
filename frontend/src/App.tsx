import './App.css'

interface Message {
  text: string;
  isUser: boolean;
}

interface EventParams {
  title: string;
  data: string;
  start_time: string;
  end_time: string;
  recurrence?: string;
  reminder?: number;
}

function App() {
  return (
    <div className="App">
    </div>)
}


export default App
