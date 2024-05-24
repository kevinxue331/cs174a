import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

export class RhythmGame extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // Flags
        this.game_start = 0;
        this.a_judge_hit = false;
        this.s_judge_hit = false;
        this.d_judge_hit = false;
        this.j_judge_hit = false;
        this.k_judge_hit = false;
        this.l_judge_hit = false;

        // Loading Screen
        this.shapes = {
            cube: new Cube(),
        }

        // Notes
        this.notes = {
            a_judge: new defs.Subdivision_Sphere(4),
            s_judge: new defs.Subdivision_Sphere(4),
            d_judge: new defs.Subdivision_Sphere(4),
            j_judge: new defs.Subdivision_Sphere(4),
            k_judge: new defs.Subdivision_Sphere(4),
            l_judge: new defs.Subdivision_Sphere(4),
        };

        // Materials
        this.materials = {
            // Loading Screen
            stage: new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#FFC5DA") }),

            // Notes
            a_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("FF595E") }),
            s_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#FF924C") }),
            d_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#FFCA3A") }),
            j_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#8AC926") }),
            k_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#1982C4") }),
            l_judge: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#6A4C93") }),
            judge_hit: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, color: hex_color("#FFFFFF") }),
        }

        this.initial_ls_camera_location = Mat4.look_at(vec3(0, 5, 100), vec3(0, 7.5, 0), vec3(0, 50, 0));
        this.initial_rg_camera_location = Mat4.look_at(vec3(0, 20, 30), vec3(0, 0, 0), vec3(0, 40, 0));
        this.started = false;
        this.progess = 0;
        this.time = 0;
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("START game", ["1"], () => {
            this.game_start++;
        });
        this.new_line();
        this.key_triggered_button("Hit red", ["a"], () => {
            this.a_judge_hit = true;
            setTimeout(() => { this.a_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit orange", ["s"], () => {
            this.s_judge_hit = true;
            setTimeout(() => { this.s_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit yellow", ["d"], () => {
            this.d_judge_hit = true;
            setTimeout(() => { this.d_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit green", ["j"], () => {
            this.j_judge_hit = true;
            setTimeout(() => { this.j_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit blue", ["k"], () => {
            this.k_judge_hit = true;
            setTimeout(() => { this.k_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit purple", ["l"], () => {
            this.l_judge_hit = true;
            setTimeout(() => { this.l_judge_hit = false; }, 45);
        });
    }
    draw_notes(context, program_state, t) {
        this.time = this.time + 1;
        let a = this.progess;
        if (this.time == 20) {
            this.time = 0;
            this.progess -= 1;
            console.log(this.progess);
        }
        var a_judge_transform = Mat4.identity()
            .times(Mat4.translation(-20, 15 + a, 0));

        var s_judge_transform = Mat4.identity()
            .times(Mat4.translation(-12, 15 + a, 0));


        var d_judge_transform = Mat4.identity()
            .times(Mat4.translation(-4, 15 + a, 0));

        var j_judge_transform = Mat4.identity()
            .times(Mat4.translation(4, 15 + a, 0));

        var k_judge_transform = Mat4.identity()
            .times(Mat4.translation(12, 15 + a, 0));

        var l_judge_transform = Mat4.identity()
            .times(Mat4.translation(20, 15, 0))
            .times(Mat4.translation(0, a, 0));
        this.shapes.cube.draw(context, program_state, a_judge_transform, this.materials.stage);
        this.shapes.cube.draw(context, program_state, s_judge_transform, this.materials.stage);
        this.shapes.cube.draw(context, program_state, d_judge_transform, this.materials.stage);
        this.shapes.cube.draw(context, program_state, j_judge_transform, this.materials.stage);
        this.shapes.cube.draw(context, program_state, k_judge_transform, this.materials.stage);
        this.shapes.cube.draw(context, program_state, l_judge_transform, this.materials.stage);
        var hi = [1, 1, 1, 1, 1, 1];
       
        const moveup = (a, shape) => {
            a_judge_transform = Mat4.translation(0, 5, 0).times(a_judge_transform);
            s_judge_transform = Mat4.translation(0, 5, 0).times(s_judge_transform);
            d_judge_transform = Mat4.translation(0, 5, 0).times(d_judge_transform);
            j_judge_transform = Mat4.translation(0, 5, 0).times(j_judge_transform);
            k_judge_transform = Mat4.translation(0, 5, 0).times(k_judge_transform);
            l_judge_transform = Mat4.translation(0, 5, 0).times(l_judge_transform);
            if (a[0] == 1) this.shapes.cube.draw(context, program_state, a_judge_transform, this.materials.stage);
            if (a[1] == 1) this.shapes.cube.draw(context, program_state, s_judge_transform, this.materials.stage);
            if (a[2] == 1) this.shapes.cube.draw(context, program_state, d_judge_transform, this.materials.stage);
            if (a[3] == 1) this.shapes.cube.draw(context, program_state, j_judge_transform, this.materials.stage);
            if (a[4] == 1) this.shapes.cube.draw(context, program_state, k_judge_transform, this.materials.stage);
            if (a[5] == 1) this.shapes.cube.draw(context, program_state, l_judge_transform, this.materials.stage);
        }
        moveup(hi);
        hi = [0, 1, 1, 0, 1, 1];
        moveup(hi);
        hi = [0, 0, 1, 0, 1, 1];
        moveup(hi);
        hi = [0, 0, 0, 0, 1, 1];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 1];
        moveup(hi);
        hi = [0, 0, 0, 0, 1, 0];
        moveup(hi);
        hi = [0, 0, 0, 1, 0, 0];
        moveup(hi);
        hi = [0, 0, 1, 0, 0, 0];
        moveup(hi);
        hi = [0, 1, 0, 0, 0, 0];
        moveup(hi);
        hi = [1, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 1];
        moveup(hi);
        hi = [0, 0, 0, 1, 0, 1];
        moveup(hi);
        hi = [0, 0, 1, 0, 1, 0];
        moveup(hi);
        hi = [0, 1, 0, 1, 0, 0];
        moveup(hi);
        hi = [1, 0, 1, 0, 0, 0];
        moveup(hi);
        hi = [0, 1, 0, 0, 0, 0];
        moveup(hi);
        hi = [1, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [1, 0, 0, 0, 0, 0];
        moveup(hi);
        hi = [0, 1, 0, 0, 0, 0];
        moveup(hi);
        hi = [1, 0, 1, 0, 0, 0];
        moveup(hi);
        hi = [0, 1, 0, 1, 0, 0];
        moveup(hi);
        hi = [0, 0, 1, 0, 1, 0];
        moveup(hi);
        hi = [0, 0, 0, 1, 0, 1];
        moveup(hi);
        hi = [0, 0, 0, 0, 1, 0];
        moveup(hi);
        hi = [0, 0, 0, 0, 0, 1];
        moveup(hi);


    }
    loading_screen(context, program_state) {
        if (!context.scratchpad.controls) {
            program_state.set_camera(this.initial_ls_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        var r = (1 + Math.sin(2 * t + 1)) / 2;
        var g = (1 + Math.sin(3 * t + 2)) / 2;
        var b = (1 + Math.sin(5 * t + 3)) / 2;

        let light_color = color(r, g, b, 1);
        const light_position = vec4(0, 10, 0, 1);
        program_state.lights = [new Light(light_position, light_color, 50000)];

        let stage_transform = Mat4.identity()
            .times(Mat4.translation(0, -20, -10))
            .times(Mat4.scale(32, 2, 16));
        this.shapes.cube.draw(context, program_state, stage_transform, this.materials.stage);

        let wow_transform = Mat4.identity()
            .times(Mat4.translation(0, -8, -10))
            .times(Mat4.scale(5, 10, 5));
        this.shapes.cube.draw(context, program_state, wow_transform, this.materials.stage);
        //add person image to this cube , change material

    }

    rhythm_game(context, program_state) {
        if (!context.scratchpad.controls) {
            program_state.set_camera(this.initial_rg_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        // Judgment line notes
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        var r = (1 + Math.sin(2 * t + 1)) / 2;
        var g = (1 + Math.sin(3 * t + 2)) / 2;
        var b = (1 + Math.sin(5 * t + 3)) / 2;

        let light_color = color(r, g, b, 1);
        const light_position = vec4(0, 10, 0, 1);
        program_state.lights = [new Light(light_position, light_color, 50000)];

        let a_judge_transform = Mat4.identity()
            .times(Mat4.translation(-20, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.a_judge_hit) {
            this.notes.a_judge.draw(context, program_state, a_judge_transform, this.materials.a_judge);
        } else {
            this.notes.a_judge.draw(context, program_state, a_judge_transform, this.materials.judge_hit);
        }

        let s_judge_transform = Mat4.identity()
            .times(Mat4.translation(-12, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.s_judge_hit) {
            this.notes.s_judge.draw(context, program_state, s_judge_transform, this.materials.s_judge);
        } else {
            this.notes.s_judge.draw(context, program_state, s_judge_transform, this.materials.judge_hit);
        }

        let d_judge_transform = Mat4.identity()
            .times(Mat4.translation(-4, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.d_judge_hit) {
            this.notes.d_judge.draw(context, program_state, d_judge_transform, this.materials.d_judge);
        } else {
            this.notes.d_judge.draw(context, program_state, d_judge_transform, this.materials.judge_hit);
        }

        let j_judge_transform = Mat4.identity()
            .times(Mat4.translation(4, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.j_judge_hit) {
            this.notes.j_judge.draw(context, program_state, j_judge_transform, this.materials.j_judge);
        } else {
            this.notes.j_judge.draw(context, program_state, j_judge_transform, this.materials.judge_hit);
        }

        let k_judge_transform = Mat4.identity()
            .times(Mat4.translation(12, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.k_judge_hit) {
            this.notes.k_judge.draw(context, program_state, k_judge_transform, this.materials.k_judge);
        } else {
            this.notes.k_judge.draw(context, program_state, k_judge_transform, this.materials.judge_hit);
        }

        let l_judge_transform = Mat4.identity()
            .times(Mat4.translation(20, -15, 0))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        if (!this.l_judge_hit) {
            this.notes.l_judge.draw(context, program_state, l_judge_transform, this.materials.l_judge);
        } else {
            this.notes.l_judge.draw(context, program_state, l_judge_transform, this.materials.judge_hit);
        }
        if (!this.started) {
            this.draw_notes(context, program_state, 5);

        }
    }

    display(context, program_state) {

        if (this.game_start > 0) {
            this.rhythm_game(context, program_state);
        } else {
            this.loading_screen(context, program_state);
        }

    }
}
