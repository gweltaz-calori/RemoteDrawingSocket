Vue.component('room-item', {
  props: ['room'],
  template: `
  <div class="room-item">
  <span class="room-item-name">{{room.name}}</span>
  <span class="room-item-users-count">{{countUserByRoom}}</span>
  </div>`,
  computed:{

    countUserByRoom()
    {
      return this.room.people.length+" utilisateur"+pluralizeItem(this.room.people.length)+" connecté"+pluralizeItem(this.room.people.length); 
    }
  }
})

Vue.component('material-radio', {
  props: ['name','id','value','my-value'],
  data(){
  	return {
  		
  	}
  },
  template: `<div class="material-radio" @click="changeRadioButton">
  	<div class="real-radio-button" :class="this.value.length && this.myValue == this.value ? 'real-radio-button-checked' : '' ">
  		<input ref="input" class="material-radio-button" type="radio" :name="name" :id="id" :value="value">
  	</div>
  	
  	<label class="md-radio-label" :for="id"><slot></slot></label>
  </div>
  `,
  methods: {
  	changeRadioButton($event) {
        
  		
        this.$emit('input', this.myValue, $event);
        
      }

  }
})

var socket = io.connect('http://10.0.2.15:3000');
var vm  = new Vue({
  el: '#app',
  data: {
    rooms:
    [ 
	    
      
    ],
    filter:'',
    visibleFilters:false
  },
  computed:{
  	filteredRooms()
  	{
  		if(this.filter =='nombre')
  		{
  			this.rooms.sort((room1,room2) => room1.countUserConnected - room2.countUserConnected );
  		}
  		else if(this.filter =='nom')
  		{
  			return this.rooms.sort((room1,room2) => {
  				return (room1.name.toUpperCase() < room2.name.toUpperCase()) ? -1 : (room1.name.toUpperCase() > room2.name.toUpperCase()) ? 1 : 0;
			});
  		}
  		return this.rooms;
  	},
    countOfRooms()
    {
      
      return this.rooms.length==0 ? '' : "("+this.rooms.length+" room"+pluralizeItem(this.rooms.length)+")";
    },
    countTotalUsers()
    {
      var total=0;
      this.rooms.forEach(room =>{
        total = total + room.people.length;
      });
      return total+" utilisateur"+pluralizeItem(total)+" connecté"+pluralizeItem(total);
    },

  },
  methods:{
  	
    
  
  },
  mounted()
  {
    socket.emit('adminLogin');
    socket.on('updateRooms', function(rooms) 
    {
      this.rooms = rooms

    }.bind(this));
  }

})

function pluralizeItem (count) 
{
  if (count == 1) 
  {
    return ''
  } 
  return 's'
}