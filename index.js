
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Habit tracker data storage
const habitData = {
  habits: [
    {
      id: 1,
      name: "Beber agua",
      dailyGoal: 8,
      unit: "vasos",
      logs: [
        { date: "2024-01-15", value: 8 },
        { date: "2024-01-16", value: 7 },
        { date: "2024-01-17", value: 8 },
        { date: "2024-01-18", value: 6 },
        { date: "2024-01-19", value: 8 },
      ],
    },
    {
      id: 2,
      name: "Ejercicio",
      dailyGoal: 30,
      unit: "minutos",
      logs: [
        { date: "2024-01-15", value: 45 },
        { date: "2024-01-16", value: 30 },
        { date: "2024-01-17", value: 0 },
        { date: "2024-01-18", value: 60 },
        { date: "2024-01-19", value: 30 },
      ],
    },
    {
      id: 3,
      name: "Dormir",
      dailyGoal: 8,
      unit: "horas",
      logs: [
        { date: "2024-01-15", value: 7 },
        { date: "2024-01-16", value: 8 },
        { date: "2024-01-17", value: 6 },
        { date: "2024-01-18", value: 8 },
        { date: "2024-01-19", value: 7 },
      ],
    },
  ],
};

// Calculate statistics for a habit
function calculateStatistics(habit) {
  if (habit.logs.length === 0) {
    return {
      average: 0,
      total: 0,
      completionRate: 0,
      streak: 0,
      bestDay: null,
      worstDay: null,
    };
  }

  const values = habit.logs.map((log) => log.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const total = values.reduce((a, b) => a + b, 0);

  // Calculate completion rate (days goal was met)
  const completedDays = values.filter((v) => v >= habit.dailyGoal).length;
  const completionRate = (completedDays / values.length) * 100;

  // Calculate streak (consecutive days meeting goal)
  let streak = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] >= habit.dailyGoal) {
      streak++;
    } else {
      break;
    }
  }

  // Find best and worst days
  const bestDay = Math.max(...values);
  const worstDay = Math.min(...values);

  return {
    average: average.toFixed(1),
    total,
    completionRate: completionRate.toFixed(1),
    streak,
    bestDay,
    worstDay,
  };
}

// Format habit data for Claude
function getHabitsFormattedData() {
  return habitData.habits
    .map((habit) => {
      const stats = calculateStatistics(habit);
      const logsString = habit.logs
        .map((log) => `${log.date}: ${log.value}${habit.unit}`)
        .join(", ");
      return `
Hábito: ${habit.name}
Meta diaria: ${habit.dailyGoal} ${habit.unit}
Registros: ${logsString}
Estadísticas:
- Promedio: ${stats.average} ${habit.unit}
- Total: ${stats.total} ${habit.unit}
- Tasa de cumplimiento: ${stats.completionRate}%
- Racha actual: ${stats.streak} días
- Mejor día: ${stats.bestDay} ${habit.unit}
- Peor día: ${stats.worstDay} ${habit.unit}`;
    })
    .join("\n---\n");
}

// Log a new habit entry
function logHabitEntry(habitId, value) {
  const habit = habitData.habits.find((h) => h.id === habitId);
  if (!habit) {
    return `Hábito no encontrado`;
  }

  const today = new Date().toISOString().split("T")[0];
  const existingIndex = habit.logs.findIndex((log) => log.date === today);

  if (existingIndex >= 0) {
    habit.logs[existingIndex].value = value;
    return `Hábito "${habit.name}" actualizado a ${value} ${habit.unit}`;
  } else {
    habit.logs.push({ date: today, value });
    return `Hábito "${habit.name}" registrado: ${value} ${habit.unit}`;
  }
}

// Create the multi-turn conversation interface
async function startConversation() {
  const conversationHistory = [];
  const systemPrompt = `Eres un asistente de salud especializado en seguimiento de hábitos saludables. 
Tienes acceso a los datos de los hábitos del usuario y sus estadísticas.
Tu rol es:
1. Ayudar al usuario a registrar nuevos hábitos
2. Analizar sus estadísticas y dar feedback
3. Proporcionar motivación y sugerencias personalizadas
4. Responder preguntas sobre su progreso

Los hábitos actuales del usuario son:
${getHabitsFormattedData()}

Cuando el usuario quiera registrar un nuevo valor, ext