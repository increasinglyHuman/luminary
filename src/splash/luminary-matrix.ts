/**
 * BlackBox Luminary — Matrix Rain
 *
 * Themed matrix rain with VFX, palette, and Akashic vocabulary.
 * Follows the shared BlackBox splash pattern (see Scripter, Landscaper, Skinner).
 *
 * Accent color: #E8A317 (Amber Gold — soul glow)
 */

export class LuminaryMatrix {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private matrix: string[] = [];
    private drops: number[] = [];
    private readonly fontSize = 14;
    private columns = 0;
    private animationId: number | null = null;
    private isActive = false;

    init(): void {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "matrixRainCanvas";
        this.canvas.style.cssText =
            "position: absolute; top: 0; left: 0; width: 100%; height: 100%; " +
            "pointer-events: none; z-index: 1; opacity: 0.6;";

        const welcomeScreen = document.getElementById("welcomeScreen");
        if (welcomeScreen) {
            welcomeScreen.insertBefore(this.canvas, welcomeScreen.firstChild);
        }

        this.ctx = this.canvas.getContext("2d");
        this.resize();

        // Luminary-themed character set — VFX, palette, Akashic vocabulary
        this.matrix = [
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "V", "F", "X",
            "R", "G", "B",
            "H", "S", "L",
            "P", "A", "L", "E", "T", "T", "E",
            "S", "O", "U", "L",
            "G", "L", "O", "W",
            "E", "M", "I", "T",
            "{", "}", ";",
            "=>", "&&", "||",
            "++", "->", "<<", ">>",
            "/", "\\", "|", "-", "_", ">", "<",
            "~", ".", ":", "*", "#",
            "[", "]", "(", ")",
            "\u2207", "\u2248", "\u221E", "\u2206", "\u03B8", "\u03BB",  // ∇ ≈ ∞ Δ θ λ
            "\u2588", "\u2593", "\u2592", "\u2591", "\u25CF", "\u25CB",  // █ ▓ ▒ ░ ● ○
            "\u2721", "\u2605", "\u2726", "\u2727",                      // ✡ ★ ✦ ✧
            "\u03B1", "\u03B2", "\u03B3", "\u03B4",                      // α β γ δ
        ];

        window.addEventListener("resize", () => this.resize());
    }

    resize(): void {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);

        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }

    start(): void {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop(): void {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
    }

    private animate(): void {
        if (!this.isActive || !this.ctx || !this.canvas) return;

        this.ctx.fillStyle = "rgba(10, 10, 10, 0.05)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#E8A317";
        this.ctx.font = this.fontSize + 'px "Space Mono", monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const char = this.matrix[Math.floor(Math.random() * this.matrix.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            if (this.drops[i] > 0) {
                const gradient = this.ctx.createLinearGradient(0, y - 50, 0, y);
                gradient.addColorStop(0, "rgba(232, 163, 23, 0)");
                gradient.addColorStop(0.5, "rgba(232, 163, 23, 0.5)");
                gradient.addColorStop(1, "rgba(232, 163, 23, 1)");
                this.ctx.fillStyle = gradient;
            }

            this.ctx.fillText(char, x, y);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }

        if (Math.random() < 0.001) {
            this.showSpecialMessage();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    private showSpecialMessage(): void {
        if (!this.ctx || !this.canvas) return;

        const messages = [
            "SOUL COLOR RESOLVED",
            "PALETTE \u2192 ARCHETYPE",
            "AKASHIC RANK UP",
            "EMBER CRYSTALLINE VOID",
            "EMISSIVE BOOST 2.4",
            "BLACKBOX LUMINARY",
            "FOUR AXIS IDENTITY",
            "THE SOUL SHOWING",
            "DEITY OVERLAY ACTIVE",
            "STR AGI END MAG WIS CUN",
            "PARTICLE DENSITY 3.0",
            "resolveAkashicPalette()",
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        const x = Math.random() * (this.canvas.width - message.length * this.fontSize);
        const y = Math.random() * this.canvas.height;

        this.ctx.save();
        this.ctx.font = "bold " + (this.fontSize * 2) + 'px "Space Mono", monospace';
        this.ctx.fillStyle = "#fff";
        this.ctx.shadowColor = "#E8A317";
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(message, x, y);
        this.ctx.restore();
    }
}

export const luminaryMatrix = new LuminaryMatrix();
