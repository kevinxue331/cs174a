import { defs, tiny } from './examples/common.js';
import { beatmap1, beatmap2 } from './beatmaps.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './shadow-demo-shaders.js'

// 2D shape, to display the texture buffer
const Square =
    class Square extends tiny.Vertex_Buffer {
        constructor() {
            super("position", "normal", "texture_coord");
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0), vec3(1, 1, 0), vec3(1, 0, 0), vec3(0, 1, 0)
            ];
            this.arrays.normal = [
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
            ];
            this.arrays.texture_coord = [
                vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1), vec(1, 0), vec(0, 1)
            ]
        }
    }

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
        this.aNote=false;
        this.sNote=false;
        this.dNote=false;
        this.jNote=false;
        this.kNote=false;
        this.lNote=false;

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

        this.collide = Array.from({ length: 80 }, () => new Array(6).fill(false)); // all beatmaps have 80 lines, 5 notes/line
        this.range = 0.1;

        // Loading Screen
        this.screen_time = 0;
        this.shapes = {
            "sphere": new defs.Subdivision_Sphere(6),
            "cube": new defs.Cube(),
            "square_2d": new Square(),
            a: new defs.Rounded_Capped_Cylinder(4, 10),
        };

        this.floor = new Material(new Shadow_Textured_Phong_Shader(1), {
            color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
            color_texture: null,
            light_depth_texture: null
        })
        
        this.pure = new Material(new Color_Phong_Shader(), { // For the first pass
        })

        this.light_src = new Material(new defs.Phong_Shader(), {
            color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
        });

        this.depth_tex =  new Material(new Depth_Texture_Shader_2D(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null
        });

        this.init_ok = false;
        
        // Rhythm Game
        this.notes = {
            a_judge: new defs.Subdivision_Sphere(4),
            s_judge: new defs.Subdivision_Sphere(4),
            d_judge: new defs.Subdivision_Sphere(4),
            j_judge: new defs.Subdivision_Sphere(4),
            k_judge: new defs.Subdivision_Sphere(4),
            l_judge: new defs.Subdivision_Sphere(4),

            beat: new defs.Subdivision_Sphere(4),
            a: new defs.Rounded_Capped_Cylinder(4, 10),
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

    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.floor.light_depth_texture = this.light_depth_texture

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    check_if_colliding(b, collider) {
        // check_if_colliding(): Collision detection function.
        // DISCLAIMER:  The collision method shown below is not used by anyone; it's just very quick
        // to code.  Making every collision body an ellipsoid is kind of a hack, and looping
        // through a list of discrete sphere points to see if the ellipsoids intersect is *really* a
        // hack (there are perfectly good analytic expressions that can test if two ellipsoids
        // intersect without discretizing them into points).
        if (this == b)
            return false;
        // Nothing collides with itself.
        // Convert sphere b to the frame where a is a unit sphere:
        const T = this.inverse.times(b.drawn_location, this.temp_matrix);

        const {intersect_test, points, leeway} = collider;
        // For each vertex in that b, shift to the coordinate frame of
        // a_inv*b.  Check if in that coordinate frame it penetrates
        // the unit sphere at the origin.  Leave some leeway.
        return points.arrays.position.some(p =>
            intersect_test(T.times(p.to4(1)).to3(), leeway));
    }
    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time;
        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(.5,.5,.5)),
                this.light_src.override({color: light_color}));
        }

        // DRAW MODELS /////////////////////////////////////////////////////////////////
        let model_trans_ball_0 = Mat4.translation(0, 1, 0);
        let model_trans_floor = Mat4.scale(16, 0.1, 10);
        let model_trans_wall_1 = Mat4.translation(-16, 0.5 - 0.1, 0).times(Mat4.scale(0.1, 0.5, 10));
        let model_trans_wall_2 = Mat4.translation(+16, 0.5 - 0.1, 0).times(Mat4.scale(0.1, 0.5, 10));
        let model_trans_wall_3 = Mat4.translation(0, 0.5 - 0.1, -10).times(Mat4.scale(16, 0.5, 0.33));
        this.shapes.cube.draw(context, program_state, model_trans_floor, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_1, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_2, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_3, shadow_pass? this.floor : this.pure);
        this.shapes.sphere.draw(context, program_state, model_trans_ball_0, shadow_pass? this.floor : this.pure);
        
    }

    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time;
        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(.5,.5,.5)),
                this.light_src.override({color: light_color}));
        }

        // DRAW MODELS HERE !!!! /////////////////////////////////////////////////////////////////
        let model_trans_ball_0 = Mat4.translation(0, 1, 0);
        let model_trans_floor = Mat4.scale(16, 0.1, 10);
        let model_trans_wall_1 = Mat4.translation(-16, 0.5 - 0.1, 0).times(Mat4.scale(0.1, 0.5, 10));
        let model_trans_wall_2 = Mat4.translation(+16, 0.5 - 0.1, 0).times(Mat4.scale(0.1, 0.5, 10));
        let model_trans_wall_3 = Mat4.translation(0, 0.5 - 0.1, -10).times(Mat4.scale(16, 0.5, 0.33));
        this.shapes.cube.draw(context, program_state, model_trans_floor, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_1, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_2, shadow_pass? this.floor : this.pure);
        this.shapes.cube.draw(context, program_state, model_trans_wall_3, shadow_pass? this.floor : this.pure);
        this.shapes.sphere.draw(context, program_state, model_trans_ball_0, shadow_pass? this.floor : this.pure);
    }

    loading_screen(context, program_state) {
        const t = program_state.animation_time;
        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);
            this.init_ok = true;
        }
        
        // Camera Movement
        const dt = program_state.animation_delta_time / 1000;
        // Camera Movement
        let position = Math.round(this.screen_time) % 20;
        let camera_positions = new Array(20);
        camera_positions[0] = Mat4.look_at(vec3(-25, 10, 25), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[1] = Mat4.look_at(vec3(-20, 10, 22), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[2] = Mat4.look_at(vec3(-15, 9, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[3] = Mat4.look_at(vec3(-12, 9, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[4] = Mat4.look_at(vec3(-9, 8, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[5] = Mat4.look_at(vec3(-6, 8, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[6] = Mat4.look_at(vec3(-3, 7, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[7] = Mat4.look_at(vec3(0, 7, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[8] = Mat4.look_at(vec3(4, 6, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[9] = Mat4.look_at(vec3(8, 6, 20), vec3(0, 2, 0), vec3(0, 1, 0));

        camera_positions[10] = Mat4.look_at(vec3(6, 6, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[11] = Mat4.look_at(vec3(3, 6, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[12] = Mat4.look_at(vec3(0, 7, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[13] = Mat4.look_at(vec3(-3, 7, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[14] = Mat4.look_at(vec3(-6, 8, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[15] = Mat4.look_at(vec3(-9, 8, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[16] = Mat4.look_at(vec3(-12, 9, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[17] = Mat4.look_at(vec3(-15, 9, 20), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[18] = Mat4.look_at(vec3(-20, 10, 22), vec3(0, 2, 0), vec3(0, 1, 0));
        camera_positions[19] = Mat4.look_at(vec3(-25, 10, 25), vec3(0, 2, 0), vec3(0, 1, 0));

        this.camera_move = camera_positions[position];
        if(!context.scratchpad.controls && this.screen_time < 0.01){
            program_state.set_camera(camera_positions[0]);
        }
        else if (this.camera_move !== null) {
            program_state.camera_inverse = this.camera_move.map(
                (x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.07)); 
        }
        this.screen_time += dt;

        // Lighting
        this.light_position = Mat4.rotation(t / 1500, 0, 1, 0).times(vec4(6, 8, 0, 1));
        this.light_color = color( 0.667 + Math.sin(t/500) / 3, 0.667 + Math.sin(t/1500) / 3, 0.667 + Math.sin(t/3500) / 3, 1 );
        this.light_view_target = vec4(0, 0, 0, 1);
        this.light_field_of_view = 130 * Math.PI / 180; // 130 degree
        program_state.lights = [new Light(this.light_position, this.light_color, 1000)];

        // Step 1: set the perspective and camera to the POV of light
        const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false,false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.render_scene(context, program_state, true,true, true);        
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
        
        this.draw_notes(context, program_state,a_judge_transform);
    }
    hit_a() {
      if(this.aNote){
        
        this.score += 10;
        this.combo = true;
        //combo++;
      }
      else{
        if(this.score>0)
        this.score -= 5;
        //this.combo = false;
        this.combo=false;
      }
        
    }    
    hit_s(){
        if(this.sNote){
            this.score += 10;
            this.combo = true;
        }
        else{
            if(this.score>0)
            this.score -= 5;
            this.combo=false;
        }
    }
    hit_d(){
        if(this.dNote){
            this.score += 10;
            this.combo = true;
        }
        else{
            if(this.score>0)
            this.score -= 5;
            this.combo=false;
        }
    }
    hit_j(){
        if(this.jNote){
            this.score += 10;
            this.combo = true;
        }
        else{
            if(this.score>0)
            this.score -= 5;
            this.combo=false;
        }
    }
    hit_k(){
        if(this.kNote){
            this.score += 10;
            this.combo = true;
        }
        else{
            if(this.score>0)
            this.score -= 5;
            this.combo=false;
        }
    }
    hit_l(){
        if(this.lNote){
            this.score += 10;
            this.combo = true;
        }
        else{
            if(this.score>0)
            this.score -= 5;
            this.combo=false;
        }
    }


    draw_notes(context, program_state,a_judge_transform) { // Draws moving notes
        let a = this.progress;
        this.progress -= 0.5;
        
        if (this.progress % 25 == 0) { // for testing
            //this.score++;
            //this.combo ^= 1;
        }
        //console.log(this.notes);
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
        const moveup = (a, line) => {
            let range =  -15 * (line + 1) - this.range;
          //  console.log(range);
            a_transform = Mat4.translation(0, 5, 0).times(a_transform);
            s_transform = Mat4.translation(0, 5, 0).times(s_transform);
            d_transform = Mat4.translation(0, 5, 0).times(d_transform);
            j_transform = Mat4.translation(0, 5, 0).times(j_transform);
            k_transform = Mat4.translation(0, 5, 0).times(k_transform);
            l_transform = Mat4.translation(0, 5, 0).times(l_transform);
            if (a[0] == 1) {
                if (a_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][0] = true;
                }
                
                if (!this.collide[line][0]) {
                    if(a_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, a_transform, this.materials.beat);
                    //console.log(a_transform);
                    //console.log(a_judge_transform);
                    //console.log(this.notes.a_judge);
                    if(a_transform[1][3]==-10){
                        this.aNote = true;
                        setTimeout(() => { this.aNote = false; }, 500);
                    }
                    //console.log(this.aNote);
                }
            }
            if (a[1] == 1) {
                if (s_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][1] = true;
                }
                if (!this.collide[line][1]) {
                    if(s_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, s_transform, this.materials.beat);
                    if(s_transform[1][3]==-10){
                        this.sNote = true;
                        setTimeout(() => { this.sNote = false; }, 500);
                    }
                }
            }
            if (a[2] == 1) {
                if (d_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][2] = true;
                }
                if (!this.collide[line][2]) {
                    if(d_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, d_transform, this.materials.beat);
                    if(d_transform[1][3]==-10){
                        this.dNote = true;
                        setTimeout(() => { this.dNote = false; }, 500);
                    }
                }
            }
            if (a[3] == 1) {
                if (j_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][3] = true;
                }
                if (!this.collide[line][3]) {
                    if(j_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, j_transform, this.materials.beat);
                    if(j_transform[1][3]==-10){
                        this.jNote = true;
                        setTimeout(() => { this.jNote = false; }, 500);
                    }
                }
            }
            if (a[4] == 1) {
                if (k_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][4] = true;
                }
                if (!this.collide[line][4]) {
                    if(k_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, k_transform, this.materials.beat);
                    if(k_transform[1][3]==-10){
                        this.kNote = true;
                        setTimeout(() => { this.kNote = false; }, 500);
                    }
                }
            }
            if (a[5] == 1) {
                if (l_transform[1][3] < range) { // y < -15.1 
                    this.collide[line][5] = true;
                }
                if (!this.collide[line][5]) {
                    if(l_transform[1][3] > -15)
                    this.notes.beat.draw(context, program_state, l_transform, this.materials.beat);
                    if(l_transform[1][3]==-10){
                        this.lNote = true;
                        setTimeout(() => { this.lNote = false; }, 500);
                    }
                }
            }
            //console.log(this.notes.beat);
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
            moveup(tmp, i,a_judge_transform);
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
            //console.log(pause);
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
            this.hit_a();
        });
        this.new_line();
        this.key_triggered_button("Hit ORANGE", ["s"], () => {
            this.s_judge_hit = true;
            setTimeout(() => { this.s_judge_hit = false; }, 45);
            this.hit_s();
        });
        this.new_line();
        this.key_triggered_button("Hit YELLOW", ["d"], () => {
            this.d_judge_hit = true;
            setTimeout(() => { this.d_judge_hit = false; }, 45);
            this.hit_d();
        });
        this.new_line();
        this.key_triggered_button("Hit GREEN", ["j"], () => {
            this.j_judge_hit = true;
            setTimeout(() => { this.j_judge_hit = false; }, 45);
            this.hit_j();
        });
        this.new_line();
        this.key_triggered_button("Hit BLUE", ["k"], () => {
            this.k_judge_hit = true;
            setTimeout(() => { this.k_judge_hit = false; }, 45);
            this.hit_k();
        });
        this.new_line();
        this.key_triggered_button("Hit PURPLE", ["l"], () => {
            this.l_judge_hit = true;
            setTimeout(() => { this.l_judge_hit = false; }, 45);
            this.hit_l();
        });
    }
}
