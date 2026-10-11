import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt =
  "Fadlan Hamsyari, software engineer in Bekasi, on a Windows XP desktop";

export async function OgCard() {
  const bliss = await readFile(join(process.cwd(), "public/bliss.jpg"));
  const wallpaper = `data:image/jpeg;base64,${bliss.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#245edb",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={wallpaper}
          width={1200}
          height={630}
          alt=""
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {["My Computer", "about.rtf", "experience.log"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 108,
                marginBottom: 18,
                color: "#fff",
                fontSize: 15,
                textShadow: "1px 1px 2px rgba(0,0,0,0.85)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#ece9d8",
                  border: "2px solid #0a246a",
                  borderRadius: 4,
                }}
              />
              <div style={{ marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 210,
            width: 920,
            height: 500,
            display: "flex",
            flexDirection: "column",
            background: "#ece9d8",
            border: "2px solid #00138c",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "6px 8px 0 rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 40,
              padding: "0 8px 0 14px",
              background:
                "linear-gradient(180deg, #3d8bff 0%, #245edb 45%, #1941a5 100%)",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", flex: 1, fontSize: 18, fontWeight: 700 }}>
              README.rtf
            </div>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  width: 28,
                  height: 24,
                  marginLeft: 4,
                  paddingBottom: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.7)",
                  background: "linear-gradient(180deg, #3c81f3 0%, #0f4fc4 100%)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                _
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 24,
                  marginLeft: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.7)",
                  background: "linear-gradient(180deg, #3c81f3 0%, #0f4fc4 100%)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    border: "2px solid #fff",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 24,
                  marginLeft: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.7)",
                  background: "linear-gradient(180deg, #f3a08a 0%, #d64f1e 100%)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                x
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 18,
              padding: "6px 14px",
              background: "#ece9d8",
              color: "#111",
              fontSize: 15,
            }}
          >
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Help</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              margin: 10,
              padding: "28px 40px",
              background: "#fff",
            }}
          >
            <div style={{ color: "#0a246a", fontSize: 20 }}>Bekasi, Indonesia</div>
            <div
              style={{
                color: "#0a246a",
                fontSize: 64,
                fontWeight: 700,
                marginTop: 16,
              }}
            >
              Fadlan Hamsyari
            </div>
            <div style={{ color: "#111", fontSize: 30, marginTop: 18 }}>
              Software engineer
            </div>
            <div style={{ color: "#333", fontSize: 24, marginTop: 10 }}>
              Tech lead on zavora.life
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 1200,
            height: 52,
            display: "flex",
            alignItems: "center",
            background:
              "linear-gradient(180deg, #3d8bff 0%, #245edb 40%, #1941a5 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 52,
              padding: "0 28px 0 16px",
              background:
                "linear-gradient(180deg, #8fd18f 0%, #3c9c3c 45%, #256428 100%)",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              fontStyle: "italic",
              borderRadius: "0 18px 18px 0",
            }}
          >
            start
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 34,
              marginLeft: 12,
              padding: "0 16px",
              background: "rgba(0,0,0,0.28)",
              color: "#fff",
              fontSize: 16,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            README.rtf
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 52,
              padding: "0 18px",
              background: "rgba(0,0,0,0.18)",
              color: "#fff",
              fontSize: 16,
            }}
          >
            Rcikaym
          </div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
