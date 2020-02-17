const glslify = require('glslify')
const toy     = require('gl-toy')
const fbo     = require('gl-fbo')
const fillScreen = require('a-big-triangle')
const createShader = require('gl-shader')

const draw = glslify('./draw.glsl')
      vert = glslify.file('./vert.glsl'),
      gol  = glslify.file('./gol.glsl')

let   initialized = false,
      sim = null
      
const state = []

function poke( x, y, value, texture ) {  
  const gl = texture.gl
  texture.bind()
  
  gl.texSubImage2D( 
    gl.TEXTURE_2D, 0, 
    x, y, 1, 1,
    gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([ value,value,value, 255 ])
  )
}

function setInitialState( width, height, tex ) {
  for( i = 0; i < width; i++ ) {
    for( j = 0; j < height; j++ ) {
      if( Math.random() > .9) {
        poke( i, j, 255, tex )
      }
    }
  }
}

function init( gl ) {
  const w = gl.drawingBufferWidth
  const h = gl.drawingBufferHeight
  state[0] = fbo( gl, [w,h] )
  state[1] = fbo( gl, [w,h] )
  
  sim = createShader( gl, vert, gol )
  
  setInitialState( w,h, state[0].color[0] )
  initialized = true
}

let current = 0
function tick( gl ) {
  const prevState = state[current]
  const curState = state[current ^= 1]
 
  curState.bind() // fbo
  sim.bind()      // shader
  
  sim.uniforms.resolution = [ gl.drawingBufferWidth, gl.drawingBufferHeight ]
  sim.uniforms.state = prevState.color[0].bind()
  
  sim.attributes.a_position.location = 0
  
  fillScreen( gl )
}

let count = 0
toy( draw, (gl, shader) => {
  if( !initialized ) init( gl )
  tick( gl )
  shader.bind()

  // restore default framebuffer binding after overriding in tick
  gl.bindFramebuffer( gl.FRAMEBUFFER, null )

  shader.uniforms.resolution = [ gl.drawingBufferWidth, gl.drawingBufferHeight ]
  shader.uniforms.uSampler = state[ 0 ].color[0].bind()
  shader.uniforms.time = count++
})