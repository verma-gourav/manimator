/* --- examples for context --- */
export const fewShotExamples = [
  {
    user: "Plot the graph of y = x^2 from -3 to 3.",
    assistant: `from manim import *

class ParabolaScene(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[0, 9, 1],
            x_length=6,
            y_length=6
        )
        graph = axes.plot(lambda x: x**2, color=BLUE)
        self.play(Create(axes))
        self.play(Create(graph))
        self.wait(1)
`,
  },
  {
    user: "Show a dot moving along a circle.",
    assistant: `from manim import *

class CircleDotScene(Scene):
    def construct(self):
        circle = Circle(radius=2)
        dot = Dot().move_to(circle.point_from_proportion(0))
        self.play(Create(circle))
        self.play(MoveAlongPath(dot, circle), run_time=5)
        self.wait(1)
`,
  },
  {
    user: "Plot y = sin(x) and y = cos(x) together from -2π to 2π.",
    assistant: `from manim import *

class SinCosScene(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-6.28, 6.28, 1],
            y_range=[-1.5, 1.5, 0.5],
            x_length=8,
            y_length=4
        )
        sin_graph = axes.plot(lambda x: np.sin(x), color=BLUE)
        cos_graph = axes.plot(lambda x: np.cos(x), color=RED)
        self.play(Create(axes))
        self.play(Create(sin_graph), Create(cos_graph))
        self.wait(1)
`,
  },
];

/* --- system prompt --- */
export const systemPrompt = `You are an expert Python developer specializing in Manim Community Edition.
Your task is to generate valid, executable Manim code.
Rules:
- Output ONLY Python code
- Do NOT include explanations or markdown
- Use Manim Community Edition syntax
- Import ONLY: from manim import *
- Define EXACTLY one Scene class
- The scene must render without user input
- Do NOT use os, sys, subprocess, socket, or file I/O
- Keep animation duration under 10 seconds
`;
