import React from "react";
import ReactDOM from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import App from "./App.jsx";
import { store } from "./store/store.js";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import QuizDetails from "./views/QuizDetails.jsx";
import QuizMeetRoom from "./views/QuizMeetRoom.jsx";
import PageNotFound from "./views/PageNotFound.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <Provider store={store}>
      <NextUIProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/quiz/:quizId" element={<QuizDetails />} />
            <Route path="/quiz/:quizId/:roomId" element={<QuizMeetRoom />} />
            <Route path="pagenotfound" element={<PageNotFound />} />
          </Routes>
        </Router>
      </NextUIProvider>
    </Provider>
  // </React.StrictMode>
);
