"use client";
import dynamic from "next/dynamic";
const LabClient = dynamic(() => import("./LabClient"), { ssr: false });
export default function LabPage() { return <LabClient />; }
