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
    <section>
      <NavbarComponent />
      <article className="w-auto md:w-[40rem] slg:w-[52rem] md:mx-auto pt-4 px-3 xs:px-5 xs:px-auto xs:pt-12 pb-8">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <ul className="grid grid-cols-1 slg:grid-cols-2 gap-4 xss:gap-6 xs:gap-8">
            {data?.map((quiz, index) => (
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
