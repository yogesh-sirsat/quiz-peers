import { useNavigate } from "react-router-dom";
import { useGetAllQuizzesQuery } from "./store/api/quizzesApi";
import QuizInfoCard from "./components/QuizInfoCard";
import NavbarComponent from "./components/ui/Navbar";
import { Card, CardBody, Button } from "@nextui-org/react";
import "./App.css";
import { QuizDTO } from "./types";

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
            <li className="cursor-pointer">
              <Card className="h-full py-2 bg-secondary-100/50 shadow-2xl border border-secondary-300/40">
                <CardBody className="flex flex-col justify-between gap-4 p-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-secondary-700">New Mode</p>
                    <h3 className="font-semibold text-2xl mt-1">Create Similarity Quiz</h3>
                    <p className="text-sm opacity-80 mt-2">
                      Build a quick room from random similarity questions and compare how players think.
                    </p>
                  </div>
                  <Button color="secondary" className="font-semibold" onClick={() => navigate("/similarity")}>
                    Start Setup
                  </Button>
                </CardBody>
              </Card>
            </li>
            {data?.map((quiz: QuizDTO, index: number) => (
              <li
                key={index}
                className=" cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.quizId}`)}
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
