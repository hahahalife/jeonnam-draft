"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [seats, setSeats] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
  const { data: seatData } = await supabase.from("seats").select("*");
  const { data: partData } = await supabase
    .from("participants")
    .select("*")
    .order("rank", { ascending: true });

  setSeats(seatData || []);
  setParticipants(partData || []);

  if (code) {
    const updatedMe = partData?.find((p) => p.code === code);
    if (updatedMe) setMe(updatedMe);
  }
}


  async function login() {
    const found = participants.find((p) => p.code === code);
    if (!found) {
      alert("코드가 존재하지 않습니다.");
      return;
    }
    setMe(found);
  }

  async function selectSeat(seatId: string) {
    if (!me) return alert("먼저 로그인하세요.");

    const { error } = await supabase.rpc("rpc_set_desired", {
      p_code: me.code,
      p_pin: pin,
      p_seat_id: seatId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    fetchData();
  }

  async function confirmSeat() {
    if (!me) return;

    const { error } = await supabase.rpc("rpc_confirm", {
      p_code: me.code,
      p_pin: pin,
    });

    if (error) {
      alert(error.message);
      return;
    }

    fetchData();
  }

  const confirmedCount = participants.filter(
    (p) => p.status === "CONFIRMED"
  ).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">도내이동 드래프트 시스템</h1>

      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">전체 진행 상황</h2>
        <p>
          확정 인원: {confirmedCount} / {participants.length}
        </p>
      </div>

      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">로그인</h2>
        <input
          className="border p-2 w-full"
          placeholder="코드 입력"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="PIN 입력"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={login}
        >
          로그인
        </button>
      </div>

      {me && (
        <div className="border p-4 rounded space-y-3">
          <h2 className="font-semibold">내 정보</h2>
          <p>순위: {me.rank}</p>
          <p>상태: {me.status}</p>
          <p>배정 자리: {me.assigned_seat_id || "없음"}</p>

          <h3 className="font-semibold mt-4">자리 선택</h3>
          {seats.map((seat) => (
            <button
              key={seat.id}
              className="block w-full border p-2 my-1"
              onClick={() => selectSeat(seat.id)}
            >
              {seat.name}
            </button>
          ))}

          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-3"
            onClick={confirmSeat}
          >
            확정하기
          </button>
        </div>
      )}

      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">순위 현황</h2>
        {participants.map((p) => (
          <div key={p.code} className="border-b py-1">
            {p.rank}번 - {p.code} - {p.status}
          </div>
        ))}
      </div>
    </div>
  );
}
