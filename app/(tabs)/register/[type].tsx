// app/(tabs)/register/[type].tsx
import { useMatchStore } from "@/src/store/useMatchStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import tw from "../../../lib/tailwind";

// Traductor para el backend (sin cambios)
const MESO_MAP = {
  Entrante: "ENT",
  Básico: "BAS",
  "Básico desarrollador": "BDE",
  "Básico estabilizador": "BES",
  "Preparatorio de control": "PRE_CON",
  Precompetitivo: "PRE_COM",
  Competitivo: "COM",
  "De restablecimiento mantenedor": "RES_MAN",
  "Preparatorio de restablecimiento": "PRE_RES",
  "Preparatorio de mantenimiento": "PRE_MAN",
};

const MICRO_MAP = {
  Ordinario: "ORD",
  "De choque intensivo": "CHO",
  "De aproximación": "APR",
  Competitivo: "COM",
  "De recuperación o restablecimiento": "REC",
};

const WEEK_MAP = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIE",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SAB",
  Domingo: "DOM",
};

const POSITION_OPTIONS = [
  { label: "Bloqueador", value: "B" },
  { label: "Defensor", value: "D" },
  { label: "Universal", value: "U" },
];

const ZONE_OPTIONS = [
  { label: "Izquierda", value: "IZQ" },
  { label: "Centro", value: "CEN" },
  { label: "Derecha", value: "DER" },
];

// --- 1. COMPONENTE PARA FILAS ---
const FormRow = ({
  children,
  zIndex,
}: {
  children: React.ReactNode;
  zIndex?: number;
}) => (
  <View
    style={[
      tw`flex-row gap-3 mb-4`,
      { zIndex: zIndex || 1, elevation: zIndex || 1 },
    ]}
  >
    {children}
  </View>
);

// --- 2. COMPONENTE PARA TEXTO (adaptado a móvil) ---
const SmartInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  const isMobile = width < 1024;

  return (
    <View
      style={tw`flex-1 flex-row items-center border border-slate-300 rounded-lg ${
        isMobile ? "h-8" : "h-12"
      } bg-slate-50 px-2`}
    >
      {isPC && (
        <Text
          style={tw`font-bold text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} mr-1 uppercase`}
        >
          {label}:
        </Text>
      )}
      <TextInput
        style={tw`flex-1 h-full text-slate-700 ${isMobile ? "text-xs" : "text-sm"}`}
        value={value}
        placeholder={isPC ? "" : label}
        placeholderTextColor="#94A3B8"
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
};

// --- 3. SELECTOR ESTILIZADO (adaptado a móvil) ---
const SmartSelect = ({
  label,
  options,
  value,
  onSelect,
  isOpen,
  setIsOpen,
  isMini,
}: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  const isMobile = width < 1024;

  return (
    <View style={{ flex: 1, zIndex: 100 }}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen ? label || value : null)}
        activeOpacity={0.8}
        style={tw`${isMini ? "h-7 px-1" : isMobile ? "h-8 px-2" : "h-12 px-3"} flex-row items-center border rounded-lg bg-slate-50 ${isMini ? "border-slate-200" : "border-slate-300"}`}
      >
        {isPC && !isMini && label !== "" && (
          <Text
            style={tw`font-bold text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} mr-1 uppercase`}
          >
            {label}:
          </Text>
        )}

        <Text
          style={tw`text-slate-700 ${isMini ? "text-[9px]" : isMobile ? "text-xs" : "text-sm"} flex-1 font-medium text-center`}
          numberOfLines={1}
        >
          {value}
        </Text>

        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={isMini ? 8 : isMobile ? 12 : 14}
          color="#003366"
        />
      </TouchableOpacity>

      {/* Menú desplegable */}
      {isOpen && (
        <View
          style={[
            tw`absolute left-0 right-0 bg-white border border-slate-300 rounded-lg shadow-xl`,
            {
              top: isMini ? 30 : isMobile ? 34 : 50,
              zIndex: 9999,
              elevation: 10,
              minWidth: isMini ? 80 : "auto",
            },
          ]}
        >
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={(event) => {
                event.stopPropagation();
                onSelect(opt);
                setIsOpen(null);
              }}
              style={tw`${isMini || isMobile ? "p-2" : "p-4"} border-b border-slate-100`}
            >
              <Text
                style={tw`text-slate-700 ${isMini ? "text-[8px]" : isMobile ? "text-xs" : "text-sm"}`}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// --- 4. FECHA Y HORA (adaptado a móvil) ---
const SmartDateTime = ({ label, value, mode, onChange }: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  const isMobile = width < 1024;
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View
        style={tw`flex-1 flex-row items-center border border-slate-300 rounded-lg ${
          isMobile ? "h-8" : "h-12"
        } bg-slate-50 px-2`}
      >
        {isPC && (
          <Text
            style={tw`font-bold text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} mr-1 uppercase`}
          >
            {label}:
          </Text>
        )}
        <input
          type={mode === "date" ? "date" : "time"}
          style={{
            flex: 1,
            border: "none",
            backgroundColor: "transparent",
            color: "#334155",
            fontSize: isMobile ? "12px" : "14px",
            outline: "none",
          }}
          value={
            value instanceof Date
              ? mode === "date"
                ? value.toISOString().split("T")[0]
                : value.toTimeString().substring(0, 5)
              : ""
          }
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            const newDate = new Date(value);
            if (mode === "date") {
              const [y, m, d] = val.split("-").map(Number);
              newDate.setFullYear(y, m - 1, d);
            } else {
              const [h, min] = val.split(":").map(Number);
              newDate.setHours(h, min);
            }
            onChange(newDate);
          }}
        />
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        style={tw`flex-row items-center border border-slate-300 rounded-lg ${
          isMobile ? "h-8" : "h-12"
        } bg-slate-50 px-2`}
      >
        {isPC && (
          <Text
            style={tw`font-bold text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} mr-1 uppercase`}
          >
            {label}:
          </Text>
        )}
        <Text style={tw`text-slate-700 ${isMobile ? "text-xs" : "text-sm"}`}>
          {value instanceof Date
            ? mode === "date"
              ? value.toLocaleDateString()
              : value.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
            : label}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode={mode}
          display={
            Platform.OS === "ios"
              ? "spinner"
              : mode === "date"
                ? "calendar"
                : "clock"
          }
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </View>
  );
};

export default function RegisterDataScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const setInitialMatchData = useMatchStore(
    (state) => state.setInitialMatchData,
  );

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    denomination: "",
    place: "",
    category: "Juvenil",
    sex: "Masculino",
    date: new Date(),
    start_time: new Date(),
    objective: "",
    meso: "Entrante",
    micro: "Ordinario",
    micro_num: "1",
    week_day: "Lunes",
  });

  const updateForm = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const [teamA, setTeamA] = useState("Equipo A");
  const [teamB, setTeamB] = useState("Equipo B");

  const initialPlayers = [
    { number: "1", fullName: "", position: "B", zone: "CEN" },
    { number: "2", fullName: "", position: "D", zone: "CEN" },
  ];

  const [playersA, setPlayersA] = useState(
    initialPlayers.map((p) => ({ ...p })),
  );
  const [playersB, setPlayersB] = useState(
    initialPlayers.map((p) => ({ ...p })),
  );

  const handleStartEvent = () => {
    const gender: "M" | "F" = formData.sex === "Masculino" ? "M" : "F";
    const currentPlatform: "web" | "mobile" =
      Platform.OS === "web" ? "web" : "mobile";
    const matchConfig = {
      tournament: formData.denomination || `${formData.meso} ${formData.micro}`,
      category: formData.category,
      date: formData.date.toISOString(),
      matchNumber: parseInt(formData.micro_num) || 1,
      gender,
      eventType:
        (type as string).charAt(0).toUpperCase() + (type as string).slice(1),
      startTime: formData.start_time.toTimeString().substring(0, 5),
      place: formData.place || undefined,
      denomination: formData.denomination || undefined,
      meso: formData.meso,
      micro: formData.micro,
      weekDay: formData.week_day,
      microNumber: formData.micro_num,
      objective: formData.objective || undefined,
      teamA: {
        name: teamA,
        players: playersA
          .map((p) => ({ number: p.number, fullName: p.fullName }))
          .filter((p) => p.number !== ""),
      },
      teamB: {
        name: teamB,
        players: playersB
          .map((p) => ({ number: p.number, fullName: p.fullName }))
          .filter((p) => p.number !== ""),
      },
      platform: currentPlatform,
    };

    const matchId = setInitialMatchData(matchConfig);
    console.log(`Partido creado: ${matchId}`);
    router.push("/game");
  };

  const updatePlayer = (
    team: "A" | "B",
    index: number,
    field: string,
    value: string,
  ) => {
    const setter = team === "A" ? setPlayersA : setPlayersB;
    setter((prevPlayers) =>
      prevPlayers.map((player, i) => {
        if (i === index) {
          return { ...player, [field]: value };
        }
        return player;
      }),
    );
  };

  const addPlayer = (team: "A" | "B") => {
    if (type !== "entrenamiento") return;
    const setter = team === "A" ? setPlayersA : setPlayersB;
    const players = team === "A" ? playersA : playersB;
    setter([
      ...players,
      { number: "", fullName: "", position: "B", zone: "CEN" },
    ]);
  };

  const removePlayer = (team: "A" | "B", index: number) => {
    if (type !== "entrenamiento") return;
    const setter = team === "A" ? setPlayersA : setPlayersB;
    const players = team === "A" ? [...playersA] : [...playersB];
    if (players.length > 1) {
      players.splice(index, 1);
      setter(players);
    }
  };

  const renderSpecificFields = () => {
    switch (type) {
      case "oficial":
        return (
          <>
            <FormRow zIndex={50}>
              <SmartInput
                label="Denominación"
                value={formData.denomination}
                onChangeText={(v: any) => updateForm("denomination", v)}
              />
              <SmartDateTime
                label="Fecha"
                mode="date"
                value={formData.date}
                onChange={(v: any) => updateForm("date", v)}
              />
            </FormRow>
            <FormRow zIndex={40}>
              <SmartDateTime
                label="Hora Inicio"
                mode="time"
                value={formData.start_time}
                onChange={(v: any) => updateForm("start_time", v)}
              />
              <SmartInput
                label="Lugar"
                value={formData.place}
                onChangeText={(v: any) => updateForm("place", v)}
              />
            </FormRow>
          </>
        );
      case "interno":
      case "externo":
        return (
          <>
            <FormRow zIndex={70}>
              <SmartSelect
                label="Mesociclo"
                options={Object.keys(MESO_MAP)}
                value={formData.meso}
                onSelect={(v: any) => updateForm("meso", v)}
                isOpen={openMenu === "Mesociclo"}
                setIsOpen={setOpenMenu}
              />
              <SmartDateTime
                label="Fecha"
                mode="date"
                value={formData.date}
                onChange={(v: any) => updateForm("date", v)}
              />
            </FormRow>
            <FormRow zIndex={60}>
              <SmartSelect
                label="Microciclo"
                options={Object.keys(MICRO_MAP)}
                value={formData.micro}
                onSelect={(v: any) => updateForm("micro", v)}
                isOpen={openMenu === "Microciclo"}
                setIsOpen={setOpenMenu}
              />
              <SmartSelect
                label="Día"
                options={Object.keys(WEEK_MAP)}
                value={formData.week_day}
                onSelect={(v: any) => updateForm("week_day", v)}
                isOpen={openMenu === "Día"}
                setIsOpen={setOpenMenu}
              />
            </FormRow>
            <FormRow zIndex={50}>
              <SmartInput
                label="No. Micro"
                value={formData.micro_num}
                keyboardType="numeric"
                onChangeText={(v: any) => updateForm("micro_num", v)}
              />
              <SmartInput
                label="Lugar"
                value={formData.place}
                onChangeText={(v: any) => updateForm("place", v)}
              />
            </FormRow>
          </>
        );
      case "entrenamiento":
        return (
          <>
            <FormRow zIndex={70}>
              <SmartSelect
                label="Mesociclo"
                options={Object.keys(MESO_MAP)}
                value={formData.meso}
                onSelect={(v: any) => updateForm("meso", v)}
                isOpen={openMenu === "Mesociclo"}
                setIsOpen={setOpenMenu}
              />
              <SmartDateTime
                label="Fecha"
                mode="date"
                value={formData.date}
                onChange={(v: any) => updateForm("date", v)}
              />
            </FormRow>
            <FormRow zIndex={60}>
              <SmartSelect
                label="Microciclo"
                options={Object.keys(MICRO_MAP)}
                value={formData.micro}
                onSelect={(v: any) => updateForm("micro", v)}
                isOpen={openMenu === "Microciclo"}
                setIsOpen={setOpenMenu}
              />
              <SmartSelect
                label="Día"
                options={Object.keys(WEEK_MAP)}
                value={formData.week_day}
                onSelect={(v: any) => updateForm("week_day", v)}
                isOpen={openMenu === "Día"}
                setIsOpen={setOpenMenu}
              />
            </FormRow>
            <FormRow zIndex={50}>
              <SmartInput
                label="No. Micro"
                value={formData.micro_num}
                keyboardType="numeric"
                onChangeText={(v: any) => updateForm("micro_num", v)}
              />
              <SmartInput
                label="Objetivo"
                value={formData.objective}
                onChangeText={(v: any) => updateForm("objective", v)}
              />
            </FormRow>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={["top"]}>
      <HeaderMenu
        title="REGISTRO"
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace("/(tabs)/menu")}
        compact={isMobile}
      />

      <ScrollView
        contentContainerStyle={tw`${isMobile ? "p-3 pt-2 pb-10" : "p-5 pt-16 pb-20"}`}
        style={{ flex: 1 }}
      >
        <Text
          style={tw`${isMobile ? "text-sm" : "text-2xl"} font-black text-[#003366] text-center mb-4 uppercase`}
        >
          {type === "oficial"
            ? "Competencia Oficial"
            : type === "interno"
              ? "Juego de Control Interno"
              : type === "externo"
                ? "Juego de Control Externo"
                : "Sesión de Entrenamiento"}
        </Text>

        {/* 1. Campos dinámicos según tipo */}
        {renderSpecificFields()}

        {/* 2. Categoría y Sexo (Comunes) */}
        <FormRow zIndex={30}>
          <SmartSelect
            label="Categoría"
            options={["Escolar", "Juvenil", "Mayores"]}
            value={formData.category}
            onSelect={(v: any) => updateForm("category", v)}
            isOpen={openMenu === "Categoría"}
            setIsOpen={setOpenMenu}
          />
          <SmartSelect
            label="Sexo"
            options={["Masculino", "Femenino"]}
            value={formData.sex}
            onSelect={(v: any) => updateForm("sex", v)}
            isOpen={openMenu === "Sexo"}
            setIsOpen={setOpenMenu}
          />
        </FormRow>

        {/* --- SECCIÓN DE PARTICIPANTES (EQUIPO A VS EQUIPO B) --- */}
        <View style={tw`flex-row items-center gap-2 my-3`}>
          <TextInput
            style={tw`flex-1 border-b-2 border-[#003366] p-1 ${isMobile ? "text-sm" : "text-lg"} font-bold`}
            placeholder="Equipo A"
            value={teamA}
            onChangeText={setTeamA}
          />
          <Text style={tw`font-black ${isMobile ? "text-base" : "text-lg"}`}>
            VS
          </Text>
          <TextInput
            style={tw`flex-1 border-b-2 border-[#003366] p-1 ${isMobile ? "text-sm" : "text-lg"} font-bold text-right`}
            placeholder="Equipo B"
            value={teamB}
            onChangeText={setTeamB}
          />
        </View>

        {/* --- TABLA EQUIPO A --- */}
        <View style={tw`flex-row justify-between items-center mb-1`}>
          <Text
            style={tw`text-[#003366] font-bold ${isMobile ? "text-xs" : "text-base"}`}
          >
            Jugadores de {teamA}
          </Text>
          {type === "entrenamiento" && (
            <TouchableOpacity
              onPress={() => addPlayer("A")}
              style={tw`flex-row items-center bg-slate-100 px-2 py-0.5 rounded`}
            >
              <Ionicons
                name="add-circle"
                size={isMobile ? 14 : 16}
                color="#003366"
              />
              <Text
                style={tw`text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} font-bold ml-1`}
              >
                Añadir
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Header Tabla Equipo A */}
        <View style={tw`bg-slate-200 flex-row p-1 rounded-t-lg`}>
          <Text
            style={tw`w-6 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            No
          </Text>
          <Text
            style={tw`flex-1 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} ml-1`}
          >
            Nombre y Apellidos
          </Text>
          <Text
            style={tw`w-16 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            Posición
          </Text>
          <Text
            style={tw`w-16 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            Zona
          </Text>
          {type === "entrenamiento" && <Text style={tw`w-6`}></Text>}
        </View>

        {playersA.map((p, i) => (
          <View
            key={`A-${i}`}
            style={[
              tw`flex-row border-x border-b border-slate-200 p-1 bg-white items-center`,
              { zIndex: 100 - i },
            ]}
          >
            <TextInput
              style={tw`w-6 text-center border border-slate-100 rounded ${isMobile ? "text-[10px] h-6" : "text-[13px] h-8"}`}
              value={p.number}
              keyboardType="numeric"
              onChangeText={(v) => updatePlayer("A", i, "number", v)}
            />
            <TextInput
              style={tw`flex-1 ml-1 border border-slate-100 rounded px-1 ${isMobile ? "text-[10px] h-6" : "text-[13px] h-8"}`}
              placeholder="Nombre..."
              value={p.fullName}
              onChangeText={(v) => updatePlayer("A", i, "fullName", v)}
            />

            {/* Selector de Posición Equipo A */}
            <View style={tw`w-16 px-0.5`}>
              <SmartSelect
                label=""
                options={POSITION_OPTIONS.map((o) => o.label)}
                value={
                  POSITION_OPTIONS.find((o) => o.value === p.position)?.label ||
                  "Pos."
                }
                onSelect={(label: string) =>
                  updatePlayer(
                    "A",
                    i,
                    "position",
                    POSITION_OPTIONS.find((o) => o.label === label)?.value ||
                      "B",
                  )
                }
                isOpen={openMenu === `A-pos-${i}`}
                setIsOpen={() =>
                  setOpenMenu(openMenu === `A-pos-${i}` ? null : `A-pos-${i}`)
                }
                isMini
              />
            </View>

            {/* Selector de Zona Equipo A */}
            <View style={tw`w-16 px-0.5`}>
              <SmartSelect
                label=""
                options={ZONE_OPTIONS.map((o) => o.label)}
                value={
                  ZONE_OPTIONS.find((o) => o.value === p.zone)?.label || "Zona"
                }
                onSelect={(label: string) =>
                  updatePlayer(
                    "A",
                    i,
                    "zone",
                    ZONE_OPTIONS.find((o) => o.label === label)?.value || "CEN",
                  )
                }
                isOpen={openMenu === `A-zone-${i}`}
                setIsOpen={() =>
                  setOpenMenu(openMenu === `A-zone-${i}` ? null : `A-zone-${i}`)
                }
                isMini
              />
            </View>

            {type === "entrenamiento" && (
              <TouchableOpacity
                onPress={() => removePlayer("A", i)}
                style={tw`w-6 items-center`}
              >
                <Ionicons
                  name="trash-outline"
                  size={isMobile ? 12 : 14}
                  color="#EF4444"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* --- TABLA EQUIPO B --- */}
        <View style={tw`flex-row justify-between items-center mt-6 mb-1`}>
          <Text
            style={tw`text-[#003366] font-bold ${isMobile ? "text-xs" : "text-base"}`}
          >
            Jugadores de {teamB}
          </Text>
          {type === "entrenamiento" && (
            <TouchableOpacity
              onPress={() => addPlayer("B")}
              style={tw`flex-row items-center bg-slate-100 px-2 py-0.5 rounded`}
            >
              <Ionicons
                name="add-circle"
                size={isMobile ? 14 : 16}
                color="#003366"
              />
              <Text
                style={tw`text-[#003366] ${isMobile ? "text-[10px]" : "text-xs"} font-bold ml-1`}
              >
                Añadir
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Header Tabla Equipo B */}
        <View style={tw`bg-slate-200 flex-row p-1 rounded-t-lg`}>
          <Text
            style={tw`w-6 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            No
          </Text>
          <Text
            style={tw`flex-1 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} ml-1`}
          >
            Nombre y Apellidos
          </Text>
          <Text
            style={tw`w-16 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            Posición
          </Text>
          <Text
            style={tw`w-16 font-bold ${isMobile ? "text-[10px]" : "text-[18px]"} text-center`}
          >
            Zona
          </Text>
          {type === "entrenamiento" && <Text style={tw`w-6`}></Text>}
        </View>

        {playersB.map((p, i) => (
          <View
            key={`B-${i}`}
            style={[
              tw`flex-row border-x border-b border-slate-200 p-1 bg-white items-center`,
              { zIndex: 50 - i },
            ]}
          >
            <TextInput
              style={tw`w-6 text-center border border-slate-100 rounded ${isMobile ? "text-[10px] h-6" : "text-[13px] h-8"}`}
              value={p.number}
              keyboardType="numeric"
              onChangeText={(v) => updatePlayer("B", i, "number", v)}
            />
            <TextInput
              style={tw`flex-1 ml-1 border border-slate-100 rounded px-1 ${isMobile ? "text-[10px] h-6" : "text-[13px] h-8"}`}
              placeholder="Nombre..."
              value={p.fullName}
              onChangeText={(v) => updatePlayer("B", i, "fullName", v)}
            />

            {/* Selector de Posición Equipo B */}
            <View style={tw`w-16 px-0.5`}>
              <SmartSelect
                label=""
                options={POSITION_OPTIONS.map((o) => o.label)}
                value={
                  POSITION_OPTIONS.find((o) => o.value === p.position)?.label ||
                  "Pos."
                }
                onSelect={(label: string) =>
                  updatePlayer(
                    "B",
                    i,
                    "position",
                    POSITION_OPTIONS.find((o) => o.label === label)?.value ||
                      "B",
                  )
                }
                isOpen={openMenu === `B-pos-${i}`}
                setIsOpen={() =>
                  setOpenMenu(openMenu === `B-pos-${i}` ? null : `B-pos-${i}`)
                }
                isMini
              />
            </View>

            {/* Selector de Zona Equipo B */}
            <View style={tw`w-16 px-0.5`}>
              <SmartSelect
                label=""
                options={ZONE_OPTIONS.map((o) => o.label)}
                value={
                  ZONE_OPTIONS.find((o) => o.value === p.zone)?.label || "Zona"
                }
                onSelect={(label: string) =>
                  updatePlayer(
                    "B",
                    i,
                    "zone",
                    ZONE_OPTIONS.find((o) => o.label === label)?.value || "CEN",
                  )
                }
                isOpen={openMenu === `B-zone-${i}`}
                setIsOpen={() =>
                  setOpenMenu(openMenu === `B-zone-${i}` ? null : `B-zone-${i}`)
                }
                isMini
              />
            </View>

            {type === "entrenamiento" && (
              <TouchableOpacity
                onPress={() => removePlayer("B", i)}
                style={tw`w-6 items-center`}
              >
                <Ionicons
                  name="trash-outline"
                  size={isMobile ? 12 : 14}
                  color="#EF4444"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* --- BOTÓN DE ACCIÓN FINAL --- */}
        <View style={tw`mt-8 mb-8`}>
          <TouchableOpacity
            onPress={handleStartEvent}
            activeOpacity={0.8}
            style={tw`bg-[#003366] ${isMobile ? "py-3" : "py-4"} rounded-2xl shadow-lg flex-row justify-center items-center`}
          >
            <Ionicons
              name="play-circle"
              size={isMobile ? 20 : 24}
              color="white"
            />
            <Text
              style={tw`text-white ${isMobile ? "text-sm" : "text-lg"} font-black ml-2 uppercase`}
            >
              Comenzar Registro de Evento
            </Text>
          </TouchableOpacity>

          <Text
            style={tw`text-slate-400 ${isMobile ? "text-[8px]" : "text-[10px]"} text-center mt-2 uppercase`}
          >
            Al continuar, se confirmarán las nóminas de ambos equipos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
