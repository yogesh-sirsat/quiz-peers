import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useLazyGetIdForPrivateRoomQuery, useLazyGetPublicRoomIdQuery } from "../store/api/roomsApi";
import { GlobeAlt, LockClosedSolid } from "../components/icons";

export default function SimilarityQuizSetup() {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [triggerPublicRoomId, { isLoading: isLoadingPublicRoomId }] = useLazyGetPublicRoomIdQuery();
  const [triggerPrivateRoomId, { isLoading: isLoadingPrivateRoomId }] = useLazyGetIdForPrivateRoomQuery();

  const safeCount = Math.max(1, Math.min(20, Number(questionCount) || 10));

  const goToRoom = (roomId: string, isPublic: boolean) => {
    navigate(`/quiz/0/${roomId}?public=${isPublic}&mode=SIMILARITY&count=${safeCount}`);
  };

  const handleJoinPublic = async () => {
    try {
      const response: any = await triggerPublicRoomId({
        mode: "SIMILARITY",
        similarityQuestionCount: safeCount
      });
      if (response.isError) {
        throw new Error(response.error?.data?.message || "Could not join public room");
      }
      if (response.data?.roomId) {
        goToRoom(response.data.roomId, true);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreatePrivate = async () => {
    try {
      const response: any = await triggerPrivateRoomId({
        mode: "SIMILARITY",
        similarityQuestionCount: safeCount
      });
      if (response.isError) {
        throw new Error(response.error?.data?.message || "Could not create private room");
      }
      if (response.data?.roomId) {
        goToRoom(response.data.roomId, false);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <section className="min-w-screen">
      <NavbarComponent />
      <section className="flex flex-col items-center px-2 xxs:px-3 xs:px-5 pt-4 xs:pt-6 pb-6">
        <Card className="w-full max-w-2xl bg-gradient-to-br from-cyan-900/80 via-indigo-900/70 to-amber-900/60 border border-cyan-200/25 shadow-2xl">
          <CardBody className="p-3 xxs:p-4 xs:p-6 gap-4 xxs:gap-5">
            <div className="rounded-2xl border border-amber-200/25 bg-black/25 p-3 xxs:p-4">
              <h1 className="text-xl xxs:text-2xl sm:text-3xl font-black tracking-wide text-amber-200">Create Similarity Quiz</h1>
              <p className="text-xs xxs:text-sm text-cyan-100/90 mt-2">
                Mode is set to <span className="font-semibold text-amber-200">SIMILARITY</span>. Questions are randomly selected.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200/20 bg-black/20 p-3 xxs:p-4 flex flex-col gap-4">
              <div className="text-[10px] xxs:text-[11px] uppercase tracking-[0.2em] text-cyan-200/90 font-bold">Round Setup</div>
              <Input
                type="number"
                label="Question Count"
                labelPlacement="outside"
                value={String(questionCount)}
                min={1}
                max={20}
                onValueChange={(value) => setQuestionCount(Number(value))}
                description="Choose between 1 and 20 questions."
                classNames={{
                  label: "text-sm xxs:text-md pb-1 xxs:pb-2",
                  inputWrapper: "h-12 xxs:h-14 rounded-xl border-2 border-cyan-200/40 bg-slate-950/20",
                  input: "text-md xxs:text-lg font-bold text-cyan-100"
                }}
              />
              <div className="grid grid-cols-2 xxs:grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={safeCount === count ? "solid" : "flat"}
                    color={safeCount === count ? "warning" : "default"}
                    className="font-bold h-10 xxs:h-11"
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <div className="text-[10px] xxs:text-xs uppercase tracking-wide text-amber-200">Using {safeCount} questions</div>
            </div>

            <div className="flex flex-row gap-2 xxs:gap-3">
              <Button
                color="secondary"
                className="font-black flex-1 h-11 xxs:h-12 text-[10px] xxs:text-sm xs:text-base px-1 xxs:px-4"
                onClick={handleJoinPublic}
                isLoading={isLoadingPublicRoomId}
                endContent={<GlobeAlt />}
              >
                JOIN PUBLIC
              </Button>
              <Button
                color="primary"
                className="font-black flex-1 h-11 xxs:h-12 text-[10px] xxs:text-sm xs:text-base px-1 xxs:px-4"
                onClick={handleCreatePrivate}
                isLoading={isLoadingPrivateRoomId}
                endContent={<LockClosedSolid />}
              >
                CREATE PRIVATE
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </section>
  );
}
