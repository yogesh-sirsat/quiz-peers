import { useEffect, useState } from "react";
import { Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";

interface NavbarComponentProps {
  isAdmin?: boolean;
}

export default function NavbarComponent({ isAdmin = false }: NavbarComponentProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isNavbarBlurred, setIsNavbarBlurred] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsNavbarBlurred(true);
      } else {
        setIsNavbarBlurred(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Navbar
      isBlurred={isNavbarBlurred}
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      className={
        (isNavbarBlurred ? " bg-background/30 " : " bg-background/0") + " dark"
      }
      id="navbar"
    >
      <NavbarBrand>
        <Link
          className="cursor-pointer"
          color={isAdmin ? "secondary" : "foreground"}
          onPress={() => {
            navigate("/");
            window.scrollTo(0, 0);
          }}
        >
          <h1 className="font-semibold text-3xl">QUIZ PEERS</h1>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden smd:flex gap-4" justify="end">
        <NavbarItem>
          <h3 className={isAdmin ? "text-xl text-primary font-medium" : "text-xl"}>
            {isAdmin ? "Admin Dashboard" : "Real-time Multiplayer Quizzes"}
          </h3>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
