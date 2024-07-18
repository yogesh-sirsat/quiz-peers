import { useParams } from "react-router-dom";
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
import Alert from "../components/ui/Alert";

export default function QuizDetails() {
  const { quizId } = useParams();
  dayjs.extend(relativeTime);
  // Using a query hook automatically fetches data and returns query values
  const { data, error, isLoading } = useGetQuizByIdQuery(quizId);
  const [triggerPublicRoomId, { isLoading: isLoadingPublicRoomId }] =
    useLazyGetPublicRoomIdQuery();

  const handleJoinPublic = async () => {
    try {
      const { data } = await triggerPublicRoomId(quizId);
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <article className="min-w-screen">
      <NavbarComponent />
      <section className="flex flex-col items-center pt-6">
        {error ? (
          <>Oh no, there was an error</>
        ) : isLoading ? (
          <>Loading...</>
        ) : data ? (
          <section className="text-foreground flex flex-col items-center bg-background/60 shadow-2xl p-5 xs:p-7 rounded-2xl">
            <Image
              className="w-[22rem] xs:w-auto"
              isBlurred
              isZoomed
              src={data?.cover_image_url}
            />
            <div className="flex flex-col gap-2 w-[22rem] xs:w-[52rem] pt-4">
              <h1 className="font-semibold text-4xl">{data?.quiz_name}</h1>

              <p>{data?.description}</p>
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
              <p className="text-sm">
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
              <h2 className="text-2xl mb-4 font-medium text-center underline">
                Join the Quiz play
              </h2>
              <Alert />
              <div className="flex flex-row justify-around w-full">
                <Tooltip color="foreground" content="Mysterious Room">
                  <Button
                    color="secondary"
                    size="lg"
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
                    size="lg"
                    onClick={() => null}
                    endContent={<LockClosedSolid />}
                  >
                    JOIN PRIVATE
                  </Button>
                </Tooltip>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </article>
  );
}
