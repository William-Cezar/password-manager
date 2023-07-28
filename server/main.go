package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
)

type PasswordCard struct {
	ID       string
	URL      string
	Name     string
	Username string
	Password string
}

var (
	passwordCards = make(map[string]*PasswordCard)
	mutex         = &sync.Mutex{}
)

func main() {
	http.HandleFunc("/password-cards", enableCors(passwordCardsHandler))
	http.HandleFunc("/password-cards/", enableCors(passwordCardHandler))
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func passwordCardsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		cards := make([]*PasswordCard, 0, len(passwordCards))
		for _, card := range passwordCards {
			cards = append(cards, card)
		}
		json.NewEncoder(w).Encode(cards)
	case "POST":
		var card PasswordCard
		err := json.NewDecoder(r.Body).Decode(&card)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		mutex.Lock()
		card.ID = uuid.New().String() // Assign a new UUID to the card
		passwordCards[card.ID] = &card
		mutex.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(card)
	default:
		http.Error(w, "Invalid method", 405)
	}
}

func passwordCardHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/password-cards/"):]
	switch r.Method {
	case "PUT":
		var card PasswordCard
		err := json.NewDecoder(r.Body).Decode(&card)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		mutex.Lock()
		if _, ok := passwordCards[id]; ok {
			card.ID = id
			passwordCards[id] = &card
		} else {
			http.Error(w, "Card not found", http.StatusNotFound)
			return
		}
		mutex.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(card)
	case "DELETE":
		mutex.Lock()
		delete(passwordCards, id)
		mutex.Unlock()
	default:
		http.Error(w, "Invalid method", 405)
	}
}

func enableCors(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if r.Method == "OPTIONS" {
			return
		}
		fn(w, r)
	}
}
