import { useParams, useNavigate } from "react-router-dom";
import { useGetQuizByIdQuery } from "../store/api/quizzesApi";
import { useLazyGetPublicRoomIdQuery } from "../store/api/roomsApi";
import NavbarComponent from "../components/ui/Navbar";
import { Image } from "@nextui-org/image";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GlobeAlt, LockClosedSolid } from "../components/icons";

export default function QuizDetails() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  dayjs.extend(relativeTime);
  // Using a query hook automatically fetches data and returns query values
  const { data, error, isLoading } = useGetQuizByIdQuery(quizId);
  const [triggerPublicRoomId, { isLoading: isLoadingPublicRoomId }] =
    useLazyGetPublicRoomIdQuery();

  const handleJoinPublic = async () => {
    try {
      const response = await triggerPublicRoomId(quizId);
      if (response.isError) {
        throw new Error(response.error?.data?.message);
      }
      if (response.data) {
        navigate(`/quiz/${quizId}/${response.data.roomId}`);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <article className="min-w-screen">
      <NavbarComponent />
      <section className="flex flex-col xs:items-center px-3 xs:px-5 pt-4 xs:pt-6">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <section className="text-foreground flex flex-col items-center bg-background/60 shadow-2xl p-4 xxs:p-5 xs:p-7 rounded-2xl">
            <Image isBlurred isZoomed src={data?.cover_image_url} />
            <div className="flex flex-col gap-2 pt-4">
              <h1 className="font-semibold text-2xl xs:text-3xl sm:text-4xl">
                {data?.quiz_name}
              </h1>

              <p className="text-sm xs:text-base">{data?.description}</p>
              <ul className="flex flex-wrap gap-1">
                {data?.categories?.map((category, index) => (
                  <li key={index}>
                    <Chip
                      className="min-w-4 min-h-4"
                      classNames={{
                        base: "bg-blue-800/20 text-blue-950",
                        content: "font-medium",
                      }}
                      color="primary"
                      size="sm"
                      radius="sm"
                      variant="flat"
                    >
                      {category}
                    </Chip>
                  </li>
                ))}
              </ul>
              <p className="text-xs xs:text-sm">
                Created {dayjs(data?.created_at).fromNow()} | Last updated{" "}
                {dayjs(data?.updated_at).fromNow()}
              </p>
              <br></br>
              <div className="flex flex-wrap gap-1">
                {data?.success_rate ? (
                  <Chip
                    className="min-w-4 min-h-4"
                    classNames={{
                      base: "bg-green-400/60 text-black border-1 border-black/50",
                      content: "font-medium",
                    }}
                    radius="sm"
                    size="sm"
                    variant="flat"
                  >
                    {data?.success_rate}% SUCCESS RATE
                  </Chip>
                ) : null}
                <Chip
                  className="min-w-4 min-h-4"
                  classNames={{
                    base: "bg-teal-400/50 text-black border-1 border-black/50",
                    content: "font-medium",
                  }}
                  radius="sm"
                  size="sm"
                  variant="flat"
                >
                  {data?.contestants_count} TIMES PLAYED
                </Chip>
                <Chip
                  className="min-w-4 min-h-4"
                  classNames={{
                    base: "bg-orange-400/50 text-black border-1 border-black/50",
                    content: "font-medium",
                  }}
                  radius="sm"
                  size="sm"
                  variant="flat"
                >
                  {data?.questions_count} TOTAL QUESTIONS
                </Chip>
              </div>
              <Divider className="my-4" />
              <h2 className="text-2xl mb-4 font-medium text-center underline underline-offset-8">
                Join Quiz play room
              </h2>
              <div className="flex flex-row justify-around w-full">
                <Tooltip color="foreground" content="Mysterious Room">
                  <Button
                    color="secondary"
                    className="px-4 xs:px-6 gap-2 xs:gap-3 min-w-20 xs:min-w-24 h-12 text-small xs:text-medium"
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
                    className="px-4 xs:px-6 gap-2 xs:gap-3 min-w-20 xs:min-w-24 h-12 text-small xs:text-medium"
                    onClick={() => null}
                    endContent={<LockClosedSolid />}
                  >
                    JOIN PRIVATE
                  </Button>
                </Tooltip>
              </div>
            </div>
          </section>
        ) : (
          <>No quiz data found</>
        )}
      </section>
    </article>
  );
}
