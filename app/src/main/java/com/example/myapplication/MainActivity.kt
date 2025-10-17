package com.example.communitydrama

import android.os.Bundle
import com.example.myapplication.R
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var searchInput: EditText
    private lateinit var searchIcon: ImageView
    private lateinit var notificationBell: ImageView
    private lateinit var tabFedcasts: LinearLayout
    private lateinit var tabMe: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initializeViews()
        setupClickListeners()
        setActiveTab(tabFedcasts) // Set Fedcasts as default active tab
    }

    private fun initializeViews() {
        searchInput = findViewById(R.id.searchInput)
        searchIcon = findViewById(R.id.searchIcon)
        notificationBell = findViewById(R.id.notificationBell)
        tabFedcasts = findViewById(R.id.tabFedcasts)
        tabMe = findViewById(R.id.tabMe)
    }

    private fun setupClickListeners() {
        // Search icon click listener
        searchIcon.setOnClickListener {
            searchInput.requestFocus()
        }

        // Search input action listener
        searchInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH) {
                performSearch()
                true
            } else {
                false
            }
        }

        // Notification bell click listener
        notificationBell.setOnClickListener {
            // Handle notification click
        }

        // Bottom navigation click listeners
        tabFedcasts.setOnClickListener {
            setActiveTab(tabFedcasts)
            // Handle Fedcasts tab click
        }

        tabMe.setOnClickListener {
            setActiveTab(tabMe)
            // Handle Me tab click
        }
    }

    private fun setActiveTab(activeTab: LinearLayout) {
        resetTabs()
        activeTab.setBackgroundColor(ContextCompat.getColor(this, android.R.color.darker_gray))
    }

    private fun resetTabs() {
        tabFedcasts.setBackgroundColor(ContextCompat.getColor(this, android.R.color.transparent))
        tabMe.setBackgroundColor(ContextCompat.getColor(this, android.R.color.transparent))
    }
    private fun performSearch() {
        val query = searchInput.text.toString().trim()
        if (query.isNotEmpty()) {
            // Perform search operation
        }
    }
}