import { Button } from "@nextui-org/button";
import { Image } from "@nextui-org/image";
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();
  const dogs404: Record<number, string> = {
    1: "bacila-vlad-wEsZOhuwoYM-unsplash",
    2: "fermin-rodriguez-penelas-LcJkpSoA0es-unsplash",
    3: "jc-gellidon-TPZNooS1Meg-unsplash",
    4: "justin-veenema-3s3oSch5f1c-unsplash",
    5: "matthew-henry-2Ts5HnA67k8-unsplash"
  };
  return (
    <article className="flex flex-col items-center min-h-screen justify-center relative gap-10">
      <Image
        isBlurred
        isZoomed
        className="w-[18rem] xxs:w-[22rem] xs:w-[26rem] sm:w-[36rem] md:w-auto"
        src={`/404dogs/${dogs404[Math.floor(Math.random() * 5) + 1]}.jpg`}
        alt="404"
      />
      <div className="flex flex-col gap-3 items-center">
        <h1 className="text-3xl">Page Not Found!</h1>
        <div className="flex flex-col xs:flex-row gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <h2 className="text-xl text-default-300 absolute bottom-2">
          @Quiz Peers
        </h2>
      </div>
    </article>
  );
}
