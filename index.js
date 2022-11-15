window.addEventListener('load', () => {
  const image = document.getElementById('image')

  const canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const context = canvas.getContext('2d', {willReadFrequently: true})

  const randButton = document.getElementById('rand')
  const uploadButton = document.getElementById('upload')

  const fileInput = document.getElementById('fileInp')

  const menu = document.getElementById('menu')
  const burger = document.getElementById('burger')
  burger.addEventListener('click', () => {
    menu.classList.toggle('menu_opened')
    burger.classList.toggle('burger_light')
  })

  const config = {
    get partSize() {
      return +localStorage.getItem('PART_SIZE') || 5
    },

    setPartSize(newSize) {
      if (newSize <= 0)
        newSize = 5
      localStorage.setItem('PART_SIZE', newSize.toString())
    },

    get mouseRad() {
      return +localStorage.getItem('CURSOR_FORCE_RADIUS') || 3000
    },

    setMouseRad(newRad) {
      if (newRad <= 0)
        newRad = 3
      localStorage.setItem('CURSOR_FORCE_RADIUS', (newRad * 1000).toString())
    },

    get friction() {
      return +localStorage.getItem('FRICTION') || 0.9
    },

    setFriction(newFriction) {
      if (newFriction <= 0)
        newFriction = 90
      localStorage.setItem('FRICTION', (newFriction * 0.01).toString())
    },

    setNewConfig({newSize, newRad, newFriction}, field) {
      this.setPartSize(newSize)
      this.setMouseRad(newRad)
      this.setFriction(newFriction)
      field.init()
      menu[0].value = config.partSize
      menu[1].value = config.mouseRad / 1000
      menu[2].value = config.friction * 100
    }
  }
  menu[0].value = config.partSize
  menu[1].value = config.mouseRad / 1000
  menu[2].value = config.friction * 100

  class Particle {
    constructor(field, x, y, color) {
      this.field = field
      this.x = x
      this.y = y
      this.originX = x
      this.originY = y
      this.color = color
      this.size = this.field.gap
      this.slow = 0.02
      this.dx = 0
      this.dy = 0
      this.d = 0
      this.force = 0
      this.angle = 0
      this.vx = 0
      this.vy = 0
      this.friction = config.friction
    }

    draw(context) {
      context.fillStyle = this.color
      context.fillRect(this.x, this.y, this.size, this.size)
    }

    update() {
      this.dx = this.field.mouse.x - this.x
      this.dy = this.field.mouse.y - this.y
      this.d = this.dx ** 2 + this.dy ** 2
      this.force = -this.field.mouse.rad / this.d

      if (this.d < this.field.mouse.rad) {
        this.angle = Math.atan2(this.dy, this.dx)
        this.vx += this.force * Math.cos(this.angle)
        this.vy += this.force * Math.sin(this.angle)
      }

      this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.slow
      this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.slow
    }

    rand() {
      this.x = Math.random() * this.field.width
      this.y = Math.random() * this.field.height
    }
  }

  class Field {
    constructor(context, width, height) {
      this.context = context
      this.width = width
      this.height = height
      this.particles = []
      this.centerX = this.width / 2
      this.centerY = this.height / 2
      this.image = null
      this.x = 0
      this.y = 0
      this.gap = config.partSize
      this.mouse = {
        rad: config.mouseRad,
        x: null,
        y: null
      }
      const removeMouseCallback = event => {
        this.mouse.x = null;
        this.mouse.y = null;
        event.stopPropagation()
      }
      menu.addEventListener('mousemove', removeMouseCallback)
      randButton.addEventListener('mousemove', removeMouseCallback)
      uploadButton.addEventListener('mousemove', removeMouseCallback)
      burger.addEventListener('mousemove', removeMouseCallback)
      window.addEventListener('mousemove', event => {
        this.mouse.x = event.x
        this.mouse.y = event.y
      })
    }

    init(image) {
      if (image) {
        this.image = image
        this.x = this.centerX - this.image.width / 2
        this.y = this.centerY - this.image.height / 2
      }
      this.gap = config.partSize
      this.mouse = {
        rad: config.mouseRad,
        x: null,
        y: null
      }
      this.particles = []
      this.context.clearRect(0, 0, this.width, this.height)
      this.context.drawImage(this.image, this.x, this.y)
      const pixels = this.context.getImageData(0, 0, this.width, this.height).data
      for (let y = 0; y < this.height; y += this.gap) {
        for (let x = 0; x < this.width; x += this.gap) {
          const index = (y * this.width + x) * 4
          const red = pixels[index]
          const green = pixels[index + 1]
          const blue = pixels[index + 2]
          const opacity = pixels[index + 3]

          if (opacity > 0) {
            const color = `rgb(${red}, ${green}, ${blue}, ${opacity})`
            this.particles.push(new Particle(this, x, y, color))
          }
        }
      }
    }

    draw() {
      for (const particle of this.particles) {
        particle.draw(this.context)
      }
    }

    update() {
      for (const particle of this.particles) {
        particle.update()
      }
    }

    rand() {
      for (const particle of this.particles) {
        particle.rand()
      }
    }
  }


  const field = new Field(context, canvas.width, canvas.height)
  field.init(image)
  field.draw(context)

  menu.addEventListener('submit', event => {
    event.preventDefault()
    config.setNewConfig({
      newSize: event.target[0].value,
      newRad: event.target[1].value,
      newFriction: event.target[2].value
    }, field)
  })

  randButton.addEventListener('click', field.rand.bind(field))
  uploadButton.addEventListener('click', () => {
    fileInput.click()
  })
  fileInput.addEventListener('change', event => {
    if (event.target.files.length > 0) {
      const img = new Image()
      img.src = URL.createObjectURL(event.target.files[0])
      img.addEventListener('load', () => field.init(img))
    }
  })

  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height)
    field.draw(context)
    field.update()
    requestAnimationFrame(animate)
  }

  animate()
})