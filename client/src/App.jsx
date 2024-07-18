import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllQuizzesQuery } from "./store/api/quizzesApi";
import QuizInfoCard from "./components/QuizInfoCard";
import NavbarComponent from "./components/ui/Navbar";
import "./App.css";

function App() {
  const navigate = useNavigate();
  // Using a query hook automatically fetches data and returns query values
  const { data, error, isLoading } = useGetAllQuizzesQuery();

  return (
    <article>
      <NavbarComponent />
      <section className="w-[22rem] xs:w-[52rem] mx-auto pt-12">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <ul className="grid grid-cols-1 xs:grid-cols-2 gap-8">
            {data?.map((quiz, index) => (
              <li
                key={index}
                className="min-h-[20rem] cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.quiz_id}`)}
              >
                <QuizInfoCard quizInfo={quiz} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </article>
  );
}

export default App;
