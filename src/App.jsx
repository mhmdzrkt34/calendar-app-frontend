import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "./views/Login";
import { Tasks } from "./views/Tasks";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Login />} path="/login" />
        <Route element={<Tasks />} path="/tasks" />
      </Routes>
    </Router>
  );
};

export default App;
