import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "not_implemented",
    message: "코어 질문 API는 아직 구현되지 않았습니다.",
  });
}
