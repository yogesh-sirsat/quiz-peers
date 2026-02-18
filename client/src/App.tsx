import { useNavigate } from "react-router-dom";
import { useGetAllQuizzesQuery } from "./store/api/quizzesApi";
import QuizInfoCard from "./components/QuizInfoCard";
import NavbarComponent from "./components/ui/Navbar";
import "./App.css";
import { Quiz } from "./types";

function App() {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  
  const { data, error, isLoading } = useGetAllQuizzesQuery({ 
    onlyValid: true, 
    includeTesting: isDev 
  });

  return (
    <section>
      <NavbarComponent />
      <article className="w-full max-w-7xl mx-auto pt-4 px-3 xs:px-5 xs:pt-12 pb-8">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xss:gap-6 xs:gap-8">
            {data?.map((quiz: Quiz, index: number) => (
              <li
                key={index}
                className=" cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.quiz_id}`)}
              >
                <QuizInfoCard quizInfo={quiz} />
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </section>
  );
}

export default App;
