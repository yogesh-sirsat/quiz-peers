import { useNavigate, useParams } from "react-router-dom";
import { useGetQuizByIdQuery } from "../store/api/quizzesApi";
import { useLazyGetIdForPrivateRoomQuery, useLazyGetPublicRoomIdQuery } from "../store/api/roomsApi";
import NavbarComponent from "../components/ui/Navbar";
import { Image } from "@nextui-org/image";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GlobeAlt, LockClosedSolid } from "../components/icons";
import QuizStatsFooter from "../components/QuizStatsFooter";
import QuizCategories from "../components/QuizCategories";

export default function QuizDetails() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  dayjs.extend(relativeTime);
  // Using a query hook automatically fetches data and returns query values
  const { data, error, isLoading } = useGetQuizByIdQuery(Number(quizId));
  const [triggerPublicRoomId, { isLoading: isLoadingPublicRoomId }] = useLazyGetPublicRoomIdQuery();
  const [triggerPrivateRoomId, { isLoading: isLoadingPrivateRoomId }] = useLazyGetIdForPrivateRoomQuery();

  const handleJoinPublic = async () => {
    if (!quizId) return;
    try {
      const response: any = await triggerPublicRoomId({ quizId: Number(quizId), mode: "TRIVIA" });
      if (response.isError) {
        throw new Error(response.error?.data?.message);
      }
      if (response.data) {
        navigate(`/quiz/${quizId}/${response.data.roomId}?public=true`);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreatePrivate = async () => {
    if (!quizId) return;
    try {
      const response: any = await triggerPrivateRoomId({ quizId: Number(quizId), mode: "TRIVIA" });
      if (response.isError) {
        throw new Error(response.error?.data?.message);
      }
      if (response.data) {
        navigate(`/quiz/${quizId}/${response.data.roomId}?public=false`);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <section className="min-w-screen">
      <NavbarComponent />
      <section className="flex flex-col xs:items-center px-2 xxs:px-3 xs:px-5 pt-4 xs:pt-6 pb-6">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <article className="text-foreground flex flex-col items-center bg-background/60 shadow-2xl p-3 xxs:p-5 xs:p-7 rounded-2xl">
            <Image 
              isBlurred 
              isZoomed 
              src={data?.coverImageUrl} 
              className="max-h-[360px] max-w-[640px] object-contain rounded-xl"
            />
            <div className="w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] flex flex-col gap-2 pt-4">
              <h1 className="font-semibold text-2xl xs:text-3xl sm:text-4xl break-words">{data?.quizName}</h1>

              <p className="text-sm xs:text-base">{data?.description}</p>
              <QuizCategories categories={data?.categories} />
              <p className="text-xs xs:text-sm">
                Created {dayjs(data?.createdAt).fromNow()} | Last updated {dayjs(data?.updatedAt).fromNow()}
              </p>
              <br></br>
              <QuizStatsFooter
                {...{
                  successRate: data?.successRate,
                  contestantsCount: data?.contestantsCount || 0,
                  questionsCount: data?.questionsCount || 0
                }}
              />
              <Divider className="my-2 md:my-4" />
              <h2 className="text-2xl mb-4 font-medium text-center underline underline-offset-8">
                Join Quiz play room
              </h2>
              <div className="flex flex-row justify-around w-full">
                <Tooltip color="foreground" content="Mysterious Room">
                  <Button
                    color="secondary"
                    className="px-3 xxs:px-4 xs:px-6 gap-2 xs:gap-3 min-w-20 xs:min-w-24 h-10 sm:h-12 text-small xs:text-medium"
                    onClick={() => handleJoinPublic()}
                    endContent={<GlobeAlt />}
                    isLoading={isLoadingPublicRoomId}
                  >
                    JOIN PUBLIC
                  </Button>
                </Tooltip>
                <Divider orientation="vertical" className="dark mx-2" />
                <Tooltip color="foreground" content="Friendly Room">
                  <Button
                    color="primary"
                    className="px-3 xxs:px-4 xs:px-6 gap-2 xs:gap-3 min-w-20 xs:min-w-24 h-10 sm:h-12 text-small xs:text-medium"
                    onClick={() => handleCreatePrivate()}
                    endContent={<LockClosedSolid />}
                    isLoading={isLoadingPrivateRoomId}
                  >
                    CREATE PRIVATE
                  </Button>
                </Tooltip>
              </div>
            </div>
          </article>
        ) : (
          <>No quiz data found</>
        )}
      </section>
    </section>
  );
}
