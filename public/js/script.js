var addItemId = 0;
function addToCart(item){
    addItemId += 1;
    var selectedItem = document.createElement('div');
    selectedItem.classList.add('cartImg');
    selectedItem.setAttribute('id',addItemId);
    var img = document.createElement('img');
    img.setAttribute('src',item.children[1].children[0].currentSrc);
    var title = document.createElement('h2');
    title.innerText = item.children[2].children[0].innerText;
    var lable = document.createElement('div');
    lable.innerText = item.children[2].children[3].children[0].innerText;
    var select = document.createElement('span');
    select.innerText = item.children[2].children[3].children[1].value;
    lable.append(select);
    var deletBtn = document.createElement('a');
    deletBtn.innerText = 'Delete';
    console.log(addItemId)
    deletBtn.setAttribute('onclick','del('+addItemId+')')
    
    var cartItems = document.getElementById('cartItems');
    selectedItem.append(img);
    selectedItem.append(title);
    selectedItem.append(lable);
    selectedItem.append(deletBtn);
    deletBtn.classList.add('delbtn');
    cartItems.append(selectedItem);
}
function del(item){
    document.getElementById(item).remove();
}

