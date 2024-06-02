import { defs, tiny } from './examples/common.js';
import { beatmap1, beatmap2 } from './beatmaps.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class RhythmGame extends Scene {

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// CLASS VARIABLES ////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        super();

        // Flags
        this.a_judge_hit = false;
        this.s_judge_hit = false;
        this.d_judge_hit = false;
        this.j_judge_hit = false;
        this.k_judge_hit = false;
        this.l_judge_hit = false;

        this.initial_ls_camera_location = Mat4.look_at(vec3(0, 5, 100), vec3(0, 7.5, 0), vec3(0, 50, 0));
        this.screen_time = 0;
        this.game_start = 0;
        this.start_over = false;

        this.initial_rg_camera_location = Mat4.look_at(vec3(0, -50, 20), vec3(0, 0, 10), vec3(0, 40, 0));
        this.beatmap = -1;
        this.progress = 0;
        this.combo = true; //becomes false whenever a beat is missed, otherwise stays true
        this.score = 0;

        this.scoreElement = document.getElementById("score");
        this.scoreNode = document.createTextNode("");
        this.scoreElement.appendChild(this.scoreNode);

        this.statusElement = document.getElementById("status");
        this.statusNode = document.createTextNode("");
        this.statusElement.appendChild(this.statusNode);

        // Loading Screen
        this.shapes = {
            cube: new defs.Cube(),
        }
        
        // Rhythm Game
        this.notes = {
            a_judge: new defs.Subdivision_Sphere(4),
            s_judge: new defs.Subdivision_Sphere(4),
            d_judge: new defs.Subdivision_Sphere(4),
            j_judge: new defs.Subdivision_Sphere(4),
            k_judge: new defs.Subdivision_Sphere(4),
            l_judge: new defs.Subdivision_Sphere(4),

            beat: new defs.Subdivision_Sphere(4),
        };

        // Materials
        this.materials = {
            // Loading Screen
            stage: new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#FFC5DA") }),

            // Rhythm Game
            beat: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#FFA382") }),
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
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// LOADING SCREEN /////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /* Loading screen animation. Just need to add more models.
        Can comment out CAMERA MOVEMENT section for time being to see static scene. */
    loading_screen(context, program_state) {
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // Camera Movement
        let position = Math.round(this.screen_time / 2) % 20;
        let camera_positions = new Array(20);
        camera_positions[0] = Mat4.look_at(vec3(-120, 50, 0), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[1] = Mat4.look_at(vec3(-90, 5, 60), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[2] = Mat4.look_at(vec3(-60, 5, 100), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[3] = Mat4.look_at(vec3(-10, 5, 90), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[4] = Mat4.look_at(vec3(30, 5, 80), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[5] = Mat4.look_at(vec3(40, 5, 70), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[6] = Mat4.look_at(vec3(70, 5, 50), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[7] = Mat4.look_at(vec3(90, 5, 30), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[8] = Mat4.look_at(vec3(100, 5, 10), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[9] = Mat4.look_at(vec3(120, 50, 10), vec3(0, 7.5, 0), vec3(0, 50, 0));

        camera_positions[10] = Mat4.look_at(vec3(100, 5, 10), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[11] = Mat4.look_at(vec3(90, 5, 30), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[12] = Mat4.look_at(vec3(70, 5, 50), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[13] = Mat4.look_at(vec3(40, 5, 70), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[14] = Mat4.look_at(vec3(30, 5, 80), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[15] = Mat4.look_at(vec3(-10, 5, 90), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[16] = Mat4.look_at(vec3(-60, 5, 100), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[17] = Mat4.look_at(vec3(-90, 5, 60), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[18] = Mat4.look_at(vec3(-120, 50, 0), vec3(0, 7.5, 0), vec3(0, 50, 0));
        camera_positions[19] = Mat4.look_at(vec3(-120, 50, 0), vec3(0, 7.5, 0), vec3(0, 50, 0));

        this.camera_move = camera_positions[position];
        if(!context.scratchpad.controls && this.screen_time < 0.01){
            program_state.set_camera(camera_positions[0]);
        }
        else if (this.camera_move !== null) {
            program_state.camera_inverse = this.camera_move.map(
                (x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.01)); 
        }

        this.screen_time += dt;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        // Lighting
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
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// GAME ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /* Code for rhythm game -- needs to implement collision detection. 
        Make sure to change this.combo and this.score when hits/misses are detected. */
    rhythm_game(context, program_state) { // Sets up scene
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
        
        this.draw_notes(context, program_state);
    }

    draw_notes(context, program_state) { // Draws moving notes
        let a = this.progress;
        this.progress -= 0.5;
        
        if (this.progress % 25 == 0) { // for testing
            this.score++;
            this.combo ^= 1;
        }

        /*
        if (this.progress == -400) { // for testing -- so don't have to wait long LOL
            this.progress = 0;
            this.score = 0;

            this.screen_time = 0;
            this.game_start = 0;
        }
        else*/ if (this.progress == -650) { 
            this.progress = 0;
            this.score = 0;

            this.screen_time = 0;
            this.game_start = 0;
        }

        // Judgement line
        var a_transform = Mat4.identity().times(Mat4.translation(-20, 15 + a, 0));

        var s_transform = Mat4.identity().times(Mat4.translation(-12, 15 + a, 0));

        var d_transform = Mat4.identity().times(Mat4.translation(-4, 15 + a, 0));

        var j_transform = Mat4.identity().times(Mat4.translation(4, 15 + a, 0));

        var k_transform = Mat4.identity().times(Mat4.translation(12, 15 + a, 0));

        var l_transform = Mat4.identity().times(Mat4.translation(20, 15 + a, 0));

        // Notes
        const moveup = (a) => {
            a_transform = Mat4.translation(0, 5, 0).times(a_transform);
            s_transform = Mat4.translation(0, 5, 0).times(s_transform);
            d_transform = Mat4.translation(0, 5, 0).times(d_transform);
            j_transform = Mat4.translation(0, 5, 0).times(j_transform);
            k_transform = Mat4.translation(0, 5, 0).times(k_transform);
            l_transform = Mat4.translation(0, 5, 0).times(l_transform);
            if (a[0] == 1) this.notes.beat.draw(context, program_state, a_transform, this.materials.beat);
            if (a[1] == 1) this.notes.beat.draw(context, program_state, s_transform, this.materials.beat);
            if (a[2] == 1) this.notes.beat.draw(context, program_state, d_transform, this.materials.beat);
            if (a[3] == 1) this.notes.beat.draw(context, program_state, j_transform, this.materials.beat);
            if (a[4] == 1) this.notes.beat.draw(context, program_state, k_transform, this.materials.beat);
            if (a[5] == 1) this.notes.beat.draw(context, program_state, l_transform, this.materials.beat);
        }
        
        // Load correct beatmap
        let map;
        if (this.beatmap == 1) {
            map = beatmap1;
        } else {
            map = beatmap2;
        }

        let tmp = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < map.length; i++) {
            tmp = map[i];
            moveup(tmp);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// DISPLAY ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /* A bunch of stuff to set up index.html -- shouldn't need more major edits */
    display(context, program_state) {
        
        if (this.game_start > 0) {
            this.rhythm_game(context, program_state);

            var source = document.getElementById("audio");
            var pause = source.paused;
            console.log(pause);
            if (pause) {
                if (this.beatmap == 1) {
                    source.src = "./assets/klee.mp3";
                    audio.load();
                }
                else if (this.beatmap == 2) {
                    source.src = "./assets/sekai.mp3";
                    audio.load();
                }
            }
            source.play(); 

            document.getElementById("scoreboard").style.visibility="visible";
            this.scoreNode.nodeValue = this.score.toFixed(0);
            document.getElementById("avatar").style.visibility="visible";
            if (this.combo) {
                this.statusNode.nodeValue = "COMBO";
                document.getElementById("combo-avatar").style.visibility="visible";
                document.getElementById("miss-avatar").style.visibility="hidden"; 
            }  
            else {
                this.statusNode.nodeValue = "MISS...";
                document.getElementById("combo-avatar").style.visibility="hidden"; 
                document.getElementById("miss-avatar").style.visibility="visible"; 
            }
            
        } else {
            this.loading_screen(context, program_state);

            document.getElementById("audio").pause(); 
            document.getElementById("audio").currentTime = 0;

            document.getElementById("scoreboard").style.visibility="hidden"; 
            document.getElementById("avatar").style.visibility="hidden";
            document.getElementById("combo-avatar").style.visibility="hidden"; 
            document.getElementById("miss-avatar").style.visibility="hidden"; 
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// CONTROLS ///////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /* Sets up controls -- shouldn't need any more edits */
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.live_string(box => {box.textContent = "Select one of the tracks below to play. \
                                                        Once the song ends, you will be returned to this loading screen,\
                                                        and then you can play again."});
        this.new_line();
        this.new_line();
        this.live_string(box => {box.textContent = "Hitting a beat earns you 10 points, while missing one deducts 5!"});
        this.live_string(box => {box.textContent = "====================================================================="});
        this.new_line();
        this.new_line();
        

        this.live_string(box => {box.textContent = "Track Options"});
        this.new_line();
        this.key_triggered_button("PLAY \"Song 1\"", ["1"], () => {
            this.beatmap = 1;
            this.game_start++;
        });
        this.new_line();
        this.key_triggered_button("PLAY \"Song 2\"", ["2"], () => {
            this.beatmap = 2;
            this.game_start++;
        });
        this.new_line();
        this.new_line();

        this.live_string(box => {box.textContent = "Controls"});
        this.new_line();
        this.key_triggered_button("Hit RED", ["a"], () => {
            this.a_judge_hit = true;
            setTimeout(() => { this.a_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit ORANGE", ["s"], () => {
            this.s_judge_hit = true;
            setTimeout(() => { this.s_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit YELLOW", ["d"], () => {
            this.d_judge_hit = true;
            setTimeout(() => { this.d_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit GREEN", ["j"], () => {
            this.j_judge_hit = true;
            setTimeout(() => { this.j_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit BLUE", ["k"], () => {
            this.k_judge_hit = true;
            setTimeout(() => { this.k_judge_hit = false; }, 45);
        });
        this.new_line();
        this.key_triggered_button("Hit PURPLE", ["l"], () => {
            this.l_judge_hit = true;
            setTimeout(() => { this.l_judge_hit = false; }, 45);
        });
    }
}
