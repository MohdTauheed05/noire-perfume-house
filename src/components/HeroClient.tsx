"use client";
import dynamic from "next/dynamic";
import { StaticBottle } from "./Hero3D";
const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false, loading: () => <StaticBottle /> });
export default function HeroClient() { return <Hero3D />; }
