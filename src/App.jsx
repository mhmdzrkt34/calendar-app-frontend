
import { BrowserRouter as Router,Routes, Route } from "react-router-dom";
import { Login } from "./views/Login";

 const App = () => {
  return (
    <Router>
      <Routes>

        <Route element={<Login/>} path="/login" />
      </Routes>
    </Router>
  )
}

export default App;