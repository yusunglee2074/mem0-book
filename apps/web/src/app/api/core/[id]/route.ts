import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "not_implemented",
    message: "코어 상세 API는 아직 구현되지 않았습니다.",
  });
}
