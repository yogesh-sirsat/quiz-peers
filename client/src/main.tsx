import React from "react";
import ReactDOM from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import App from "./App";
import { store } from "./store/store";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import QuizDetails from "./views/QuizDetails";
import QuizMeetRoom from "./views/QuizMeetRoom";
import PageNotFound from "./views/PageNotFound";
import AdminLogin from "./views/AdminLogin";
import AdminPanel from "./views/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
    <Provider store={store}>
      <NextUIProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/quiz/:quizId" element={<QuizDetails />} />
            <Route path="/quiz/:quizId/:roomId" element={<QuizMeetRoom />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="pagenotfound" element={<PageNotFound />} />
          </Routes>
        </Router>
      </NextUIProvider>
    </Provider>
  // </React.StrictMode>
);
